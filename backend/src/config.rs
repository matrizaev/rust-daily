use std::{
    num::{NonZeroU64, NonZeroUsize},
    path::{Path, PathBuf},
    time::Duration,
};

use config::{Config, ConfigError, Environment};
use serde::Deserialize;
use thiserror::Error;

use crate::model::{ValidationLimits, ValidationLimitsError};

#[derive(Debug, Clone)]
pub struct AppConfig {
    pub bind_address: BindAddress,
    pub queue_capacity: NonZeroUsize,
    pub workers: NonZeroUsize,
    pub timeout: Duration,
    pub max_output_bytes: NonZeroUsize,
    pub runner_image: RunnerImage,
    pub workspace_root: WorkspaceRoot,
    pub cors_origin: Option<CorsOrigin>,
    pub validation_limits: ValidationLimits,
    pub max_json_payload_bytes: NonZeroUsize,
}

#[derive(Debug, Deserialize)]
struct RawAppConfig {
    host: String,
    port: u16,
    queue_capacity: usize,
    workers: usize,
    timeout_secs: u64,
    max_output_bytes: usize,
    runner_image: String,
    workspace_root: PathBuf,
    cors_origin: String,
    max_files: usize,
    max_file_bytes: usize,
    max_total_bytes: usize,
    max_json_payload_bytes: usize,
}

#[derive(Debug, Error)]
pub enum AppConfigError {
    #[error("failed to load configuration: {0}")]
    Load(#[from] ConfigError),
    #[error("configuration field `{field}` must be greater than 0")]
    NonZero { field: ConfigField },
    #[error("configuration field `{field}` must not be empty")]
    Empty { field: ConfigField },
    #[error("invalid validation limits: {0}")]
    InvalidValidationLimits(#[from] ValidationLimitsError),
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum ConfigField {
    Host,
    QueueCapacity,
    Workers,
    TimeoutSecs,
    MaxOutputBytes,
    RunnerImage,
    WorkspaceRoot,
    CorsOrigin,
    MaxFiles,
    MaxFileBytes,
    MaxTotalBytes,
    MaxJsonPayloadBytes,
}

impl std::fmt::Display for ConfigField {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::Host => "host",
            Self::QueueCapacity => "queue_capacity",
            Self::Workers => "workers",
            Self::TimeoutSecs => "timeout_secs",
            Self::MaxOutputBytes => "max_output_bytes",
            Self::RunnerImage => "runner_image",
            Self::WorkspaceRoot => "workspace_root",
            Self::CorsOrigin => "cors_origin",
            Self::MaxFiles => "max_files",
            Self::MaxFileBytes => "max_file_bytes",
            Self::MaxTotalBytes => "max_total_bytes",
            Self::MaxJsonPayloadBytes => "max_json_payload_bytes",
        };

        formatter.write_str(name)
    }
}

#[derive(Debug, Clone)]
pub struct BindAddress(String);

impl BindAddress {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for BindAddress {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(self.as_str())
    }
}

impl TryFrom<(String, u16)> for BindAddress {
    type Error = AppConfigError;

    fn try_from((host, port): (String, u16)) -> Result<Self, Self::Error> {
        let host = host.trim();
        if host.is_empty() {
            return Err(AppConfigError::Empty {
                field: ConfigField::Host,
            });
        }

        Ok(Self(format!("{host}:{port}")))
    }
}

#[derive(Debug, Clone)]
pub struct RunnerImage(String);

impl RunnerImage {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for RunnerImage {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(self.as_str())
    }
}

impl TryFrom<String> for RunnerImage {
    type Error = AppConfigError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let value = value.trim();
        if value.is_empty() {
            return Err(AppConfigError::Empty {
                field: ConfigField::RunnerImage,
            });
        }

        Ok(Self(value.to_string()))
    }
}

#[derive(Debug, Clone)]
pub struct WorkspaceRoot(PathBuf);

impl WorkspaceRoot {
    pub fn as_path(&self) -> &Path {
        &self.0
    }
}

impl TryFrom<PathBuf> for WorkspaceRoot {
    type Error = AppConfigError;

    fn try_from(value: PathBuf) -> Result<Self, Self::Error> {
        if value.as_os_str().is_empty() {
            return Err(AppConfigError::Empty {
                field: ConfigField::WorkspaceRoot,
            });
        }

        Ok(Self(value))
    }
}

#[derive(Debug, Clone)]
pub struct CorsOrigin(String);

impl CorsOrigin {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<String> for CorsOrigin {
    type Error = AppConfigError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let value = value.trim();
        if value.is_empty() {
            return Err(AppConfigError::Empty {
                field: ConfigField::CorsOrigin,
            });
        }

        Ok(Self(value.to_string()))
    }
}

impl AppConfig {
    pub fn from_env() -> Result<Self, AppConfigError> {
        let raw = Config::builder()
            .set_default("host", "127.0.0.1")?
            .set_default("port", 8080_i64)?
            .set_default("queue_capacity", 20_i64)?
            .set_default("workers", 2_i64)?
            .set_default("timeout_secs", 10_i64)?
            .set_default("max_output_bytes", 65_536_i64)?
            .set_default("runner_image", "rust-runner:1.96")?
            .set_default("workspace_root", "/tmp/rust-daily-runs")?
            .set_default("cors_origin", "")?
            .set_default("max_files", 8_i64)?
            .set_default("max_file_bytes", 65_536_i64)?
            .set_default("max_total_bytes", 262_144_i64)?
            .set_default("max_json_payload_bytes", 300_000_i64)?
            .add_source(
                Environment::with_prefix("RUST_DAILY")
                    .prefix_separator("_")
                    .try_parsing(true),
            )
            .build()?
            .try_deserialize::<RawAppConfig>()?;

        raw.try_into()
    }

    pub fn bind_address(&self) -> &BindAddress {
        &self.bind_address
    }
}

impl TryFrom<RawAppConfig> for AppConfig {
    type Error = AppConfigError;

    fn try_from(raw: RawAppConfig) -> Result<Self, Self::Error> {
        let queue_capacity = nonzero_usize(ConfigField::QueueCapacity, raw.queue_capacity)?;
        let workers = nonzero_usize(ConfigField::Workers, raw.workers)?;
        let timeout_secs = nonzero_u64(ConfigField::TimeoutSecs, raw.timeout_secs)?;
        let max_output_bytes = nonzero_usize(ConfigField::MaxOutputBytes, raw.max_output_bytes)?;
        let max_files = nonzero_usize(ConfigField::MaxFiles, raw.max_files)?;
        let max_file_bytes = nonzero_usize(ConfigField::MaxFileBytes, raw.max_file_bytes)?;
        let max_total_bytes = nonzero_usize(ConfigField::MaxTotalBytes, raw.max_total_bytes)?;
        let max_json_payload_bytes =
            nonzero_usize(ConfigField::MaxJsonPayloadBytes, raw.max_json_payload_bytes)?;
        let validation_limits =
            ValidationLimits::try_new(max_files, max_file_bytes, max_total_bytes)?;

        let cors_origin = raw.cors_origin.trim();
        let cors_origin = if cors_origin.is_empty() {
            None
        } else {
            Some(CorsOrigin::try_from(cors_origin.to_string())?)
        };

        Ok(Self {
            bind_address: BindAddress::try_from((raw.host, raw.port))?,
            queue_capacity,
            workers,
            timeout: Duration::from_secs(timeout_secs.get()),
            max_output_bytes,
            runner_image: RunnerImage::try_from(raw.runner_image)?,
            workspace_root: WorkspaceRoot::try_from(raw.workspace_root)?,
            cors_origin,
            validation_limits,
            max_json_payload_bytes,
        })
    }
}

fn nonzero_usize(field: ConfigField, value: usize) -> Result<NonZeroUsize, AppConfigError> {
    NonZeroUsize::new(value).ok_or(AppConfigError::NonZero { field })
}

fn nonzero_u64(field: ConfigField, value: u64) -> Result<NonZeroU64, AppConfigError> {
    NonZeroU64::new(value).ok_or(AppConfigError::NonZero { field })
}
