use std::{
    num::{NonZeroU64, NonZeroUsize},
    path::{Path, PathBuf},
    time::Duration,
};

use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;
use thiserror::Error;

use crate::model::{ValidationLimits, ValidationLimitsError};

const DEFAULT_CONFIG_DIR: &str = "config";
const DEFAULT_ENVIRONMENT: &str = "local";

#[derive(Debug, Clone)]
pub struct Settings {
    pub server: ServerSettings,
    pub frontend: FrontendSettings,
    pub runner: RunnerSettings,
    pub validation: ValidationSettings,
    pub api: ApiSettings,
}

#[derive(Debug, Clone)]
pub struct ServerSettings {
    pub bind_address: BindAddress,
    pub cors_origin: Option<CorsOrigin>,
}

#[derive(Debug, Clone)]
pub struct FrontendSettings {
    pub dist: FrontendDist,
}

#[derive(Debug, Clone)]
pub struct RunnerSettings {
    pub queue_capacity: NonZeroUsize,
    pub workers: NonZeroUsize,
    pub timeout: Duration,
    pub max_output_bytes: NonZeroUsize,
    pub image: RunnerImage,
    pub workspace_root: WorkspaceRoot,
    pub podman_path: PodmanPath,
}

#[derive(Debug, Clone)]
pub struct ValidationSettings {
    pub limits: ValidationLimits,
}

#[derive(Debug, Clone)]
pub struct ApiSettings {
    pub max_json_payload_bytes: NonZeroUsize,
}

#[derive(Debug, Deserialize)]
struct RawSettings {
    server: RawServerSettings,
    frontend: RawFrontendSettings,
    runner: RawRunnerSettings,
    validation: RawValidationSettings,
    api: RawApiSettings,
}

#[derive(Debug, Deserialize)]
struct RawServerSettings {
    host: String,
    port: u16,
    #[serde(default)]
    cors_origin: Option<String>,
}

#[derive(Debug, Deserialize)]
struct RawFrontendSettings {
    dist: PathBuf,
}

#[derive(Debug, Deserialize)]
struct RawRunnerSettings {
    queue_capacity: usize,
    workers: usize,
    timeout_secs: u64,
    max_output_bytes: usize,
    image: String,
    workspace_root: PathBuf,
    podman_path: PathBuf,
}

#[derive(Debug, Deserialize)]
struct RawValidationSettings {
    max_files: usize,
    max_file_bytes: usize,
    max_total_bytes: usize,
}

#[derive(Debug, Deserialize)]
struct RawApiSettings {
    max_json_payload_bytes: usize,
}

#[derive(Debug, Error)]
pub enum SettingsError {
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
    ServerHost,
    RunnerQueueCapacity,
    RunnerWorkers,
    RunnerTimeoutSecs,
    RunnerMaxOutputBytes,
    RunnerImage,
    RunnerWorkspaceRoot,
    RunnerPodmanPath,
    FrontendDist,
    ServerCorsOrigin,
    ValidationMaxFiles,
    ValidationMaxFileBytes,
    ValidationMaxTotalBytes,
    ApiMaxJsonPayloadBytes,
}

impl std::fmt::Display for ConfigField {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::ServerHost => "server.host",
            Self::RunnerQueueCapacity => "runner.queue_capacity",
            Self::RunnerWorkers => "runner.workers",
            Self::RunnerTimeoutSecs => "runner.timeout_secs",
            Self::RunnerMaxOutputBytes => "runner.max_output_bytes",
            Self::RunnerImage => "runner.image",
            Self::RunnerWorkspaceRoot => "runner.workspace_root",
            Self::RunnerPodmanPath => "runner.podman_path",
            Self::FrontendDist => "frontend.dist",
            Self::ServerCorsOrigin => "server.cors_origin",
            Self::ValidationMaxFiles => "validation.max_files",
            Self::ValidationMaxFileBytes => "validation.max_file_bytes",
            Self::ValidationMaxTotalBytes => "validation.max_total_bytes",
            Self::ApiMaxJsonPayloadBytes => "api.max_json_payload_bytes",
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
    type Error = SettingsError;

    fn try_from((host, port): (String, u16)) -> Result<Self, Self::Error> {
        let host = host.trim();
        if host.is_empty() {
            return Err(SettingsError::Empty {
                field: ConfigField::ServerHost,
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
    type Error = SettingsError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let value = value.trim();
        if value.is_empty() {
            return Err(SettingsError::Empty {
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
    type Error = SettingsError;

    fn try_from(value: PathBuf) -> Result<Self, Self::Error> {
        if value.as_os_str().is_empty() {
            return Err(SettingsError::Empty {
                field: ConfigField::RunnerWorkspaceRoot,
            });
        }

        Ok(Self(value))
    }
}

#[derive(Debug, Clone)]
pub struct PodmanPath(PathBuf);

impl PodmanPath {
    pub fn as_path(&self) -> &Path {
        &self.0
    }
}

impl TryFrom<PathBuf> for PodmanPath {
    type Error = SettingsError;

    fn try_from(value: PathBuf) -> Result<Self, Self::Error> {
        if value.as_os_str().is_empty() {
            return Err(SettingsError::Empty {
                field: ConfigField::RunnerPodmanPath,
            });
        }

        Ok(Self(value))
    }
}

#[derive(Debug, Clone)]
pub struct FrontendDist(PathBuf);

impl FrontendDist {
    pub fn as_path(&self) -> &Path {
        &self.0
    }
}

impl TryFrom<PathBuf> for FrontendDist {
    type Error = SettingsError;

    fn try_from(value: PathBuf) -> Result<Self, Self::Error> {
        if value.as_os_str().is_empty() {
            return Err(SettingsError::Empty {
                field: ConfigField::FrontendDist,
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
    type Error = SettingsError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let value = value.trim();
        if value.is_empty() {
            return Err(SettingsError::Empty {
                field: ConfigField::ServerCorsOrigin,
            });
        }

        Ok(Self(value.to_string()))
    }
}

pub fn load_settings() -> Result<Settings, SettingsError> {
    let app_env = std::env::var("RUST_DAILY_ENV")
        .or_else(|_| std::env::var("APP_ENV"))
        .unwrap_or_else(|_| DEFAULT_ENVIRONMENT.to_string());
    let config_dir = std::env::var("RUST_DAILY_CONFIG_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(DEFAULT_CONFIG_DIR));

    load_settings_from_dir(&config_dir, &app_env)
}

pub fn load_settings_from_dir(config_dir: &Path, app_env: &str) -> Result<Settings, SettingsError> {
    load_settings_from_dir_with_environment(config_dir, app_env, true)
}

fn load_settings_from_dir_with_environment(
    config_dir: &Path,
    app_env: &str,
    include_environment: bool,
) -> Result<Settings, SettingsError> {
    let mut builder = Config::builder()
        .add_source(File::from(config_dir.join("default.yaml")))
        .add_source(File::from(config_dir.join(format!("{app_env}.yaml"))).required(false));

    if include_environment {
        builder = builder.add_source(
            Environment::with_prefix("RUST_DAILY")
                .prefix_separator("_")
                .separator("__")
                .try_parsing(true),
        );
        builder = apply_legacy_environment_overrides(builder)?;
    }

    let raw = builder.build()?.try_deserialize::<RawSettings>()?;
    raw.try_into()
}

fn apply_legacy_environment_overrides(
    mut builder: config::ConfigBuilder<config::builder::DefaultState>,
) -> Result<config::ConfigBuilder<config::builder::DefaultState>, ConfigError> {
    if let Some(value) = env_string("RUST_DAILY_HOST") {
        builder = builder.set_override("server.host", value)?;
    }
    if let Some(value) = env_number("RUST_DAILY_PORT")? {
        builder = builder.set_override("server.port", value)?;
    }
    if let Some(value) = env_string("RUST_DAILY_CORS_ORIGIN") {
        builder = builder.set_override("server.cors_origin", value)?;
    }
    if let Some(value) = env_string("RUST_DAILY_FRONTEND_DIST") {
        builder = builder.set_override("frontend.dist", value)?;
    }
    if let Some(value) = env_number("RUST_DAILY_QUEUE_CAPACITY")? {
        builder = builder.set_override("runner.queue_capacity", value)?;
    }
    if let Some(value) = env_number("RUST_DAILY_WORKERS")? {
        builder = builder.set_override("runner.workers", value)?;
    }
    if let Some(value) = env_number("RUST_DAILY_TIMEOUT_SECS")? {
        builder = builder.set_override("runner.timeout_secs", value)?;
    }
    if let Some(value) = env_number("RUST_DAILY_MAX_OUTPUT_BYTES")? {
        builder = builder.set_override("runner.max_output_bytes", value)?;
    }
    if let Some(value) = env_string("RUST_DAILY_RUNNER_IMAGE") {
        builder = builder.set_override("runner.image", value)?;
    }
    if let Some(value) = env_string("RUST_DAILY_WORKSPACE_ROOT") {
        builder = builder.set_override("runner.workspace_root", value)?;
    }
    if let Some(value) = env_string("RUST_DAILY_PODMAN_PATH") {
        builder = builder.set_override("runner.podman_path", value)?;
    }
    if let Some(value) = env_number("RUST_DAILY_MAX_FILES")? {
        builder = builder.set_override("validation.max_files", value)?;
    }
    if let Some(value) = env_number("RUST_DAILY_MAX_FILE_BYTES")? {
        builder = builder.set_override("validation.max_file_bytes", value)?;
    }
    if let Some(value) = env_number("RUST_DAILY_MAX_TOTAL_BYTES")? {
        builder = builder.set_override("validation.max_total_bytes", value)?;
    }
    if let Some(value) = env_number("RUST_DAILY_MAX_JSON_PAYLOAD_BYTES")? {
        builder = builder.set_override("api.max_json_payload_bytes", value)?;
    }

    Ok(builder)
}

fn env_string(name: &str) -> Option<String> {
    std::env::var(name).ok()
}

fn env_number(name: &str) -> Result<Option<i64>, ConfigError> {
    let Some(value) = env_string(name) else {
        return Ok(None);
    };

    value
        .parse::<i64>()
        .map(Some)
        .map_err(|error| ConfigError::Message(format!("{name} must be an integer: {error}")))
}

impl TryFrom<RawSettings> for Settings {
    type Error = SettingsError;

    fn try_from(raw: RawSettings) -> Result<Self, Self::Error> {
        Ok(Self {
            server: raw.server.try_into()?,
            frontend: raw.frontend.try_into()?,
            runner: raw.runner.try_into()?,
            validation: raw.validation.try_into()?,
            api: raw.api.try_into()?,
        })
    }
}

impl TryFrom<RawServerSettings> for ServerSettings {
    type Error = SettingsError;

    fn try_from(raw: RawServerSettings) -> Result<Self, Self::Error> {
        let cors_origin = raw
            .cors_origin
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty())
            .map(CorsOrigin::try_from)
            .transpose()?;

        Ok(Self {
            bind_address: BindAddress::try_from((raw.host, raw.port))?,
            cors_origin,
        })
    }
}

impl TryFrom<RawFrontendSettings> for FrontendSettings {
    type Error = SettingsError;

    fn try_from(raw: RawFrontendSettings) -> Result<Self, Self::Error> {
        Ok(Self {
            dist: FrontendDist::try_from(raw.dist)?,
        })
    }
}

impl TryFrom<RawRunnerSettings> for RunnerSettings {
    type Error = SettingsError;

    fn try_from(raw: RawRunnerSettings) -> Result<Self, Self::Error> {
        let queue_capacity = nonzero_usize(ConfigField::RunnerQueueCapacity, raw.queue_capacity)?;
        let workers = nonzero_usize(ConfigField::RunnerWorkers, raw.workers)?;
        let timeout_secs = nonzero_u64(ConfigField::RunnerTimeoutSecs, raw.timeout_secs)?;
        let max_output_bytes =
            nonzero_usize(ConfigField::RunnerMaxOutputBytes, raw.max_output_bytes)?;

        Ok(Self {
            queue_capacity,
            workers,
            timeout: Duration::from_secs(timeout_secs.get()),
            max_output_bytes,
            image: RunnerImage::try_from(raw.image)?,
            workspace_root: WorkspaceRoot::try_from(raw.workspace_root)?,
            podman_path: PodmanPath::try_from(raw.podman_path)?,
        })
    }
}

impl TryFrom<RawValidationSettings> for ValidationSettings {
    type Error = SettingsError;

    fn try_from(raw: RawValidationSettings) -> Result<Self, Self::Error> {
        let max_files = nonzero_usize(ConfigField::ValidationMaxFiles, raw.max_files)?;
        let max_file_bytes =
            nonzero_usize(ConfigField::ValidationMaxFileBytes, raw.max_file_bytes)?;
        let max_total_bytes =
            nonzero_usize(ConfigField::ValidationMaxTotalBytes, raw.max_total_bytes)?;

        Ok(Self {
            limits: ValidationLimits::try_new(max_files, max_file_bytes, max_total_bytes)?,
        })
    }
}

impl TryFrom<RawApiSettings> for ApiSettings {
    type Error = SettingsError;

    fn try_from(raw: RawApiSettings) -> Result<Self, Self::Error> {
        Ok(Self {
            max_json_payload_bytes: nonzero_usize(
                ConfigField::ApiMaxJsonPayloadBytes,
                raw.max_json_payload_bytes,
            )?,
        })
    }
}

fn nonzero_usize(field: ConfigField, value: usize) -> Result<NonZeroUsize, SettingsError> {
    NonZeroUsize::new(value).ok_or(SettingsError::NonZero { field })
}

fn nonzero_u64(field: ConfigField, value: u64) -> Result<NonZeroU64, SettingsError> {
    NonZeroU64::new(value).ok_or(SettingsError::NonZero { field })
}

#[cfg(test)]
mod tests {
    use std::{fs, path::Path};

    use tempfile::tempdir;

    use super::{ConfigField, SettingsError, load_settings_from_dir_with_environment};

    #[test]
    fn loads_default_and_environment_config_layers() {
        let root = tempdir().expect("temp config dir should be created");
        write_config(root.path(), "default.yaml", default_config());
        write_config(
            root.path(),
            "local.yaml",
            "
server:
  port: 19090
  cors_origin: http://localhost:5173
runner:
  workers: 3
",
        );

        let settings = load_settings_from_dir_without_environment(root.path(), "local")
            .expect("settings should load");

        assert_eq!(settings.server.bind_address.as_str(), "127.0.0.1:19090");
        assert_eq!(
            settings
                .server
                .cors_origin
                .as_ref()
                .expect("cors origin")
                .as_str(),
            "http://localhost:5173"
        );
        assert_eq!(settings.frontend.dist.as_path(), Path::new("frontend/dist"));
        assert_eq!(settings.runner.workers.get(), 3);
        assert_eq!(settings.runner.queue_capacity.get(), 20);
        assert_eq!(settings.runner.podman_path.as_path(), Path::new("podman"));
        assert_eq!(settings.validation.limits.max_files(), 8);
    }

    #[test]
    fn empty_cors_origin_is_disabled() {
        let root = tempdir().expect("temp config dir should be created");
        write_config(root.path(), "default.yaml", default_config());
        write_config(
            root.path(),
            "local.yaml",
            "
server:
  cors_origin: ''
",
        );

        let settings = load_settings_from_dir_without_environment(root.path(), "local")
            .expect("settings should load");

        assert!(settings.server.cors_origin.is_none());
    }

    #[test]
    fn rejects_zero_runner_workers() {
        let root = tempdir().expect("temp config dir should be created");
        write_config(root.path(), "default.yaml", default_config());
        write_config(
            root.path(),
            "local.yaml",
            "
runner:
  workers: 0
",
        );

        let error = load_settings_from_dir_without_environment(root.path(), "local")
            .expect_err("zero workers should fail");

        assert!(matches!(
            error,
            SettingsError::NonZero {
                field: ConfigField::RunnerWorkers
            }
        ));
    }

    #[test]
    fn rejects_total_limit_below_file_limit() {
        let root = tempdir().expect("temp config dir should be created");
        write_config(root.path(), "default.yaml", default_config());
        write_config(
            root.path(),
            "local.yaml",
            "
validation:
  max_file_bytes: 100
  max_total_bytes: 99
",
        );

        let error = load_settings_from_dir_without_environment(root.path(), "local")
            .expect_err("invalid validation limits should fail");

        assert!(matches!(error, SettingsError::InvalidValidationLimits(_)));
    }

    fn load_settings_from_dir_without_environment(
        config_dir: &Path,
        app_env: &str,
    ) -> Result<super::Settings, super::SettingsError> {
        load_settings_from_dir_with_environment(config_dir, app_env, false)
    }

    fn write_config(root: &Path, name: &str, contents: &str) {
        fs::write(root.join(name), contents).expect("test config should be written");
    }

    fn default_config() -> &'static str {
        "
server:
  host: 127.0.0.1
  port: 8080
  cors_origin: null
frontend:
  dist: frontend/dist
runner:
  queue_capacity: 20
  workers: 2
  timeout_secs: 10
  max_output_bytes: 65536
  image: rust-runner:1.95
  workspace_root: /tmp/rust-daily-runs
  podman_path: podman
validation:
  max_files: 8
  max_file_bytes: 65536
  max_total_bytes: 262144
api:
  max_json_payload_bytes: 300000
"
    }
}
