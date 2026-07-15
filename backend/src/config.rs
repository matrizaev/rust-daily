//! Typed configuration loading and validation.
//!
//! Raw YAML and environment values are converted into narrow types before the
//! rest of the backend can use paths, origins, image names, or resource limits.

use std::{
    fmt,
    net::{IpAddr, SocketAddr},
    num::{NonZeroU64, NonZeroUsize},
    path::{Path, PathBuf},
    time::Duration,
};

use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;
use thiserror::Error;
use url::Url;

use crate::model::{ValidationLimits, ValidationLimitsError};

const DEFAULT_CONFIG_DIR: &str = "config";
const DEFAULT_ENVIRONMENT: &str = "local";

/// Fully validated backend settings.
#[derive(Debug, Clone)]
pub struct Settings {
    /// HTTP server settings.
    pub server: ServerSettings,
    /// Static frontend settings.
    pub frontend: FrontendSettings,
    /// Runner and queue settings.
    pub runner: RunnerSettings,
    /// Request validation limits.
    pub validation: ValidationSettings,
    /// API transport limits.
    pub api: ApiSettings,
    /// Metrics and operational observability settings.
    pub observability: ObservabilitySettings,
}

/// HTTP server bind and browser-origin settings.
#[derive(Debug, Clone)]
pub struct ServerSettings {
    /// Socket address Actix binds to.
    pub bind_address: BindAddress,
    /// Optional allowed CORS origin for browser requests.
    pub cors_origin: Option<CorsOrigin>,
}

/// Static frontend asset settings.
#[derive(Debug, Clone)]
pub struct FrontendSettings {
    /// Directory containing the built Vite frontend.
    pub dist: FrontendDist,
}

/// Runner, queue, and container resource settings.
#[derive(Debug, Clone)]
pub struct RunnerSettings {
    /// Maximum number of queued validation jobs.
    pub queue_capacity: NonZeroUsize,
    /// Number of worker tasks consuming the queue.
    pub workers: NonZeroUsize,
    /// End-to-end request deadline for queueing, execution, and cleanup.
    pub timeout: Duration,
    /// Timeout for cleanup operations.
    pub cleanup_timeout: Duration,
    /// Maximum learner-visible stdout and stderr bytes.
    pub max_output_bytes: NonZeroUsize,
    /// Maximum raw process output retained before terminating a run.
    pub max_process_output_bytes: NonZeroUsize,
    /// Size of the writable `/workspace` tmpfs inside the runner container.
    pub workspace_tmpfs_bytes: NonZeroU64,
    /// Memory limit applied to the runner container.
    pub container_memory_bytes: NonZeroU64,
    /// CPU quota applied to the runner container.
    pub container_cpus: ContainerCpus,
    /// Process limit applied to the runner container.
    pub container_pids_limit: NonZeroU64,
    /// Size of the runner container's `/tmp` tmpfs.
    pub tmp_tmpfs_bytes: NonZeroU64,
    /// Memory headroom reserved for Cargo and rustc outside tmpfs mounts.
    pub process_headroom_bytes: NonZeroU64,
    /// Core-file ulimit passed to Podman.
    pub core_ulimit: CoreUlimit,
    /// Local Podman image used for lesson validation.
    pub image: RunnerImage,
    /// Host directory used for temporary per-job workspaces.
    pub workspace_root: WorkspaceRoot,
    /// Path to the Podman executable.
    pub podman_path: PodmanPath,
}

/// Validated request validation settings.
#[derive(Debug, Clone)]
pub struct ValidationSettings {
    /// Limits applied before a request reaches the runner.
    pub limits: ValidationLimits,
}

/// HTTP API transport settings.
#[derive(Debug, Clone)]
pub struct ApiSettings {
    /// Maximum JSON payload accepted by the Actix extractor.
    pub max_json_payload_bytes: NonZeroUsize,
}

/// Metrics and operational observability settings.
#[derive(Debug, Clone)]
pub struct ObservabilitySettings {
    /// Whether the Prometheus metrics endpoint is enabled.
    pub metrics_enabled: bool,
    /// Optional bearer token required by `/metrics`.
    pub metrics_bearer_token: Option<MetricsBearerToken>,
}

#[derive(Debug, Deserialize)]
struct RawSettings {
    server: RawServerSettings,
    frontend: RawFrontendSettings,
    runner: RawRunnerSettings,
    validation: RawValidationSettings,
    api: RawApiSettings,
    #[serde(default)]
    observability: RawObservabilitySettings,
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
    cleanup_timeout_secs: u64,
    max_output_bytes: usize,
    max_process_output_bytes: usize,
    workspace_tmpfs_bytes: u64,
    container_memory_bytes: u64,
    container_cpus: f64,
    container_pids_limit: u64,
    tmp_tmpfs_bytes: u64,
    process_headroom_bytes: u64,
    core_ulimit: String,
    image: String,
    workspace_root: PathBuf,
    podman_path: PathBuf,
}

#[derive(Debug, Deserialize)]
struct RawValidationSettings {
    max_files: usize,
    max_file_bytes: usize,
    max_total_bytes: usize,
    max_path_bytes: usize,
    max_path_component_bytes: usize,
    max_diagnostic_snippets_per_case: usize,
    max_diagnostic_snippet_bytes: usize,
    max_diagnostic_total_bytes: usize,
}

#[derive(Debug, Deserialize)]
struct RawApiSettings {
    max_json_payload_bytes: usize,
}

#[derive(Debug, Deserialize)]
struct RawObservabilitySettings {
    #[serde(default = "default_metrics_enabled")]
    metrics_enabled: bool,
    #[serde(default)]
    metrics_bearer_token: Option<String>,
}

impl Default for RawObservabilitySettings {
    fn default() -> Self {
        Self {
            metrics_enabled: default_metrics_enabled(),
            metrics_bearer_token: None,
        }
    }
}

/// Errors raised while loading or validating configuration.
#[derive(Debug, Error)]
pub enum SettingsError {
    /// The underlying configuration loader failed.
    #[error("failed to load configuration: {0}")]
    Load(#[from] ConfigError),
    /// A numeric field that must be non-zero was zero.
    #[error("configuration field `{field}` must be greater than 0")]
    NonZero {
        /// Configuration field that failed validation.
        field: ConfigField,
    },
    /// A required string or path field was empty.
    #[error("configuration field `{field}` must not be empty")]
    Empty {
        /// Configuration field that failed validation.
        field: ConfigField,
    },
    /// A field failed semantic validation.
    #[error("configuration field `{field}` is invalid: {reason}")]
    Invalid {
        /// Configuration field that failed validation.
        field: ConfigField,
        /// Static explanation of the failed validation rule.
        reason: &'static str,
    },
    /// Validation limits were internally inconsistent.
    #[error("invalid validation limits: {0}")]
    InvalidValidationLimits(#[from] ValidationLimitsError),
}

/// Identifies a configuration field in validation errors.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub enum ConfigField {
    /// `server.host`
    ServerHost,
    /// `server.port`
    ServerPort,
    /// `runner.queue_capacity`
    RunnerQueueCapacity,
    /// `runner.workers`
    RunnerWorkers,
    /// `runner.timeout_secs`
    RunnerTimeoutSecs,
    /// `runner.cleanup_timeout_secs`
    RunnerCleanupTimeoutSecs,
    /// `runner.max_output_bytes`
    RunnerMaxOutputBytes,
    /// `runner.max_process_output_bytes`
    RunnerMaxProcessOutputBytes,
    /// `runner.workspace_tmpfs_bytes`
    RunnerWorkspaceTmpfsBytes,
    /// `runner.container_memory_bytes`
    RunnerContainerMemoryBytes,
    /// `runner.container_cpus`
    RunnerContainerCpus,
    /// `runner.container_pids_limit`
    RunnerContainerPidsLimit,
    /// `runner.tmp_tmpfs_bytes`
    RunnerTmpTmpfsBytes,
    /// `runner.process_headroom_bytes`
    RunnerProcessHeadroomBytes,
    /// `runner.core_ulimit`
    RunnerCoreUlimit,
    /// `runner.image`
    RunnerImage,
    /// `runner.workspace_root`
    RunnerWorkspaceRoot,
    /// `runner.podman_path`
    RunnerPodmanPath,
    /// `frontend.dist`
    FrontendDist,
    /// `server.cors_origin`
    ServerCorsOrigin,
    /// `validation.max_files`
    ValidationMaxFiles,
    /// `validation.max_file_bytes`
    ValidationMaxFileBytes,
    /// `validation.max_total_bytes`
    ValidationMaxTotalBytes,
    /// `validation.max_path_bytes`
    ValidationMaxPathBytes,
    /// `validation.max_path_component_bytes`
    ValidationMaxPathComponentBytes,
    /// `validation.max_diagnostic_snippets_per_case`
    ValidationMaxDiagnosticSnippetsPerCase,
    /// `validation.max_diagnostic_snippet_bytes`
    ValidationMaxDiagnosticSnippetBytes,
    /// `validation.max_diagnostic_total_bytes`
    ValidationMaxDiagnosticTotalBytes,
    /// `api.max_json_payload_bytes`
    ApiMaxJsonPayloadBytes,
    /// `observability.metrics_bearer_token`
    ObservabilityMetricsBearerToken,
}

impl std::fmt::Display for ConfigField {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let name = match self {
            Self::ServerHost => "server.host",
            Self::ServerPort => "server.port",
            Self::RunnerQueueCapacity => "runner.queue_capacity",
            Self::RunnerWorkers => "runner.workers",
            Self::RunnerTimeoutSecs => "runner.timeout_secs",
            Self::RunnerCleanupTimeoutSecs => "runner.cleanup_timeout_secs",
            Self::RunnerMaxOutputBytes => "runner.max_output_bytes",
            Self::RunnerMaxProcessOutputBytes => "runner.max_process_output_bytes",
            Self::RunnerWorkspaceTmpfsBytes => "runner.workspace_tmpfs_bytes",
            Self::RunnerContainerMemoryBytes => "runner.container_memory_bytes",
            Self::RunnerContainerCpus => "runner.container_cpus",
            Self::RunnerContainerPidsLimit => "runner.container_pids_limit",
            Self::RunnerTmpTmpfsBytes => "runner.tmp_tmpfs_bytes",
            Self::RunnerProcessHeadroomBytes => "runner.process_headroom_bytes",
            Self::RunnerCoreUlimit => "runner.core_ulimit",
            Self::RunnerImage => "runner.image",
            Self::RunnerWorkspaceRoot => "runner.workspace_root",
            Self::RunnerPodmanPath => "runner.podman_path",
            Self::FrontendDist => "frontend.dist",
            Self::ServerCorsOrigin => "server.cors_origin",
            Self::ValidationMaxFiles => "validation.max_files",
            Self::ValidationMaxFileBytes => "validation.max_file_bytes",
            Self::ValidationMaxTotalBytes => "validation.max_total_bytes",
            Self::ValidationMaxPathBytes => "validation.max_path_bytes",
            Self::ValidationMaxPathComponentBytes => "validation.max_path_component_bytes",
            Self::ValidationMaxDiagnosticSnippetsPerCase => {
                "validation.max_diagnostic_snippets_per_case"
            }
            Self::ValidationMaxDiagnosticSnippetBytes => "validation.max_diagnostic_snippet_bytes",
            Self::ValidationMaxDiagnosticTotalBytes => "validation.max_diagnostic_total_bytes",
            Self::ApiMaxJsonPayloadBytes => "api.max_json_payload_bytes",
            Self::ObservabilityMetricsBearerToken => "observability.metrics_bearer_token",
        };

        formatter.write_str(name)
    }
}

/// Validated bearer token used to protect the Prometheus metrics endpoint.
#[derive(Clone, Eq, PartialEq)]
pub struct MetricsBearerToken(String);

impl AsRef<str> for MetricsBearerToken {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl fmt::Debug for MetricsBearerToken {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        formatter.write_str("MetricsBearerToken(<redacted>)")
    }
}

impl TryFrom<String> for MetricsBearerToken {
    type Error = SettingsError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let value = value.trim();
        if value.is_empty() {
            return Err(SettingsError::Empty {
                field: ConfigField::ObservabilityMetricsBearerToken,
            });
        }
        if value.chars().any(char::is_control) {
            return Err(SettingsError::Invalid {
                field: ConfigField::ObservabilityMetricsBearerToken,
                reason: "must not contain control characters",
            });
        }

        Ok(Self(value.to_string()))
    }
}

/// Validated Actix bind address.
#[derive(Debug, Clone)]
pub struct BindAddress(SocketAddr);

impl std::fmt::Display for BindAddress {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(formatter)
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

        let host = host.parse::<IpAddr>().map_err(|_| SettingsError::Invalid {
            field: ConfigField::ServerHost,
            reason: "must be an IPv4 or IPv6 address",
        })?;
        let port = std::num::NonZeroU16::new(port).ok_or(SettingsError::NonZero {
            field: ConfigField::ServerPort,
        })?;

        Ok(Self(SocketAddr::new(host, port.get())))
    }
}

/// Validated Podman image reference for runner containers.
#[derive(Debug, Clone)]
pub struct RunnerImage(String);

impl AsRef<str> for RunnerImage {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for RunnerImage {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        formatter.write_str(self.as_ref())
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

        if value.starts_with('-') || value.chars().any(|character| character.is_control()) {
            return Err(SettingsError::Invalid {
                field: ConfigField::RunnerImage,
                reason: "must be an image reference without leading options or control characters",
            });
        }

        Ok(Self(value.to_string()))
    }
}

/// Positive finite CPU quota for Podman.
#[derive(Debug, Clone)]
pub struct ContainerCpus(f64);

impl std::fmt::Display for ContainerCpus {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        self.0.fmt(formatter)
    }
}

impl TryFrom<f64> for ContainerCpus {
    type Error = SettingsError;

    fn try_from(value: f64) -> Result<Self, Self::Error> {
        if !value.is_finite() || value <= 0.0 {
            return Err(SettingsError::Invalid {
                field: ConfigField::RunnerContainerCpus,
                reason: "must be a positive finite number",
            });
        }

        Ok(Self(value))
    }
}

/// Podman `core=` ulimit value.
#[derive(Debug, Clone)]
pub struct CoreUlimit(String);

impl std::fmt::Display for CoreUlimit {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "core={}", self.0)
    }
}

impl TryFrom<String> for CoreUlimit {
    type Error = SettingsError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        let value = value.trim();
        if value.is_empty() {
            return Err(SettingsError::Empty {
                field: ConfigField::RunnerCoreUlimit,
            });
        }

        if value.starts_with('-') || value.chars().any(|character| character.is_control()) {
            return Err(SettingsError::Invalid {
                field: ConfigField::RunnerCoreUlimit,
                reason: "must be a ulimit value without leading options or control characters",
            });
        }

        Ok(Self(value.to_string()))
    }
}

/// Host directory where per-run temporary workspaces are created.
#[derive(Debug, Clone)]
pub struct WorkspaceRoot(PathBuf);

impl AsRef<Path> for WorkspaceRoot {
    fn as_ref(&self) -> &Path {
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

/// Validated path to the Podman executable.
#[derive(Debug, Clone)]
pub struct PodmanPath(PathBuf);

impl AsRef<Path> for PodmanPath {
    fn as_ref(&self) -> &Path {
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

/// Directory containing the built frontend assets.
#[derive(Debug, Clone)]
pub struct FrontendDist(PathBuf);

impl AsRef<Path> for FrontendDist {
    fn as_ref(&self) -> &Path {
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

/// Normalized HTTP or HTTPS origin accepted by CORS middleware.
#[derive(Debug, Clone)]
pub struct CorsOrigin(String);

impl AsRef<str> for CorsOrigin {
    fn as_ref(&self) -> &str {
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

        let parsed = Url::parse(value).map_err(|_| SettingsError::Invalid {
            field: ConfigField::ServerCorsOrigin,
            reason: "must be an absolute HTTP or HTTPS origin",
        })?;

        if !matches!(parsed.scheme(), "http" | "https")
            || parsed.host_str().is_none()
            || !parsed.username().is_empty()
            || parsed.password().is_some()
            || parsed.path() != "/"
            || parsed.query().is_some()
            || parsed.fragment().is_some()
        {
            return Err(SettingsError::Invalid {
                field: ConfigField::ServerCorsOrigin,
                reason: "must contain only an HTTP or HTTPS scheme, host, and optional port",
            });
        }

        let normalized = parsed.origin().ascii_serialization();
        if normalized == "null" {
            return Err(SettingsError::Invalid {
                field: ConfigField::ServerCorsOrigin,
                reason: "must have a serializable origin",
            });
        }

        Ok(Self(normalized))
    }
}

/// Loads settings from the default config directory and process environment.
pub fn load_settings() -> Result<Settings, SettingsError> {
    let app_env =
        std::env::var("RUST_DAILY_ENV").unwrap_or_else(|_| DEFAULT_ENVIRONMENT.to_string());
    let config_dir = std::env::var("RUST_DAILY_CONFIG_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(DEFAULT_CONFIG_DIR));

    load_settings_from_dir_with_environment(&config_dir, &app_env, true)
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
    }

    let raw = builder.build()?.try_deserialize::<RawSettings>()?;
    raw.try_into()
}

impl TryFrom<RawSettings> for Settings {
    type Error = SettingsError;

    fn try_from(raw: RawSettings) -> Result<Self, Self::Error> {
        let validation: ValidationSettings = raw.validation.try_into()?;
        let api: ApiSettings = raw.api.try_into()?;
        if api.max_json_payload_bytes.get() < validation.limits.max_json_payload_bytes() {
            return Err(SettingsError::Invalid {
                field: ConfigField::ApiMaxJsonPayloadBytes,
                reason: "must cover the worst-case JSON payload permitted by validation limits",
            });
        }

        Ok(Self {
            server: raw.server.try_into()?,
            frontend: raw.frontend.try_into()?,
            runner: raw.runner.try_into()?,
            validation,
            api,
            observability: raw.observability.try_into()?,
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
        let cleanup_timeout_secs = nonzero_u64(
            ConfigField::RunnerCleanupTimeoutSecs,
            raw.cleanup_timeout_secs,
        )?;
        let max_output_bytes =
            nonzero_usize(ConfigField::RunnerMaxOutputBytes, raw.max_output_bytes)?;
        let max_process_output_bytes = nonzero_usize(
            ConfigField::RunnerMaxProcessOutputBytes,
            raw.max_process_output_bytes,
        )?;
        if max_process_output_bytes < max_output_bytes {
            return Err(SettingsError::Invalid {
                field: ConfigField::RunnerMaxProcessOutputBytes,
                reason: "must be greater than or equal to runner.max_output_bytes",
            });
        }
        let workspace_tmpfs_bytes = nonzero_u64(
            ConfigField::RunnerWorkspaceTmpfsBytes,
            raw.workspace_tmpfs_bytes,
        )?;
        let container_memory_bytes = nonzero_u64(
            ConfigField::RunnerContainerMemoryBytes,
            raw.container_memory_bytes,
        )?;
        let container_cpus = ContainerCpus::try_from(raw.container_cpus)?;
        let container_pids_limit = nonzero_u64(
            ConfigField::RunnerContainerPidsLimit,
            raw.container_pids_limit,
        )?;
        let tmp_tmpfs_bytes = nonzero_u64(ConfigField::RunnerTmpTmpfsBytes, raw.tmp_tmpfs_bytes)?;
        let process_headroom_bytes = nonzero_u64(
            ConfigField::RunnerProcessHeadroomBytes,
            raw.process_headroom_bytes,
        )?;
        if workspace_tmpfs_bytes
            .get()
            .saturating_add(tmp_tmpfs_bytes.get())
            .saturating_add(process_headroom_bytes.get())
            > container_memory_bytes.get()
        {
            return Err(SettingsError::Invalid {
                field: ConfigField::RunnerWorkspaceTmpfsBytes,
                reason: "plus runner.tmp_tmpfs_bytes and runner.process_headroom_bytes must fit in runner.container_memory_bytes",
            });
        }
        Ok(Self {
            queue_capacity,
            workers,
            timeout: Duration::from_secs(timeout_secs.get()),
            cleanup_timeout: Duration::from_secs(cleanup_timeout_secs.get()),
            max_output_bytes,
            max_process_output_bytes,
            workspace_tmpfs_bytes,
            container_memory_bytes,
            container_cpus,
            container_pids_limit,
            tmp_tmpfs_bytes,
            process_headroom_bytes,
            core_ulimit: CoreUlimit::try_from(raw.core_ulimit)?,
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
        let max_path_bytes =
            nonzero_usize(ConfigField::ValidationMaxPathBytes, raw.max_path_bytes)?;
        let max_path_component_bytes = nonzero_usize(
            ConfigField::ValidationMaxPathComponentBytes,
            raw.max_path_component_bytes,
        )?;
        let max_diagnostic_snippets_per_case = nonzero_usize(
            ConfigField::ValidationMaxDiagnosticSnippetsPerCase,
            raw.max_diagnostic_snippets_per_case,
        )?;
        let max_diagnostic_snippet_bytes = nonzero_usize(
            ConfigField::ValidationMaxDiagnosticSnippetBytes,
            raw.max_diagnostic_snippet_bytes,
        )?;
        let max_diagnostic_total_bytes = nonzero_usize(
            ConfigField::ValidationMaxDiagnosticTotalBytes,
            raw.max_diagnostic_total_bytes,
        )?;

        Ok(Self {
            limits: ValidationLimits::try_new(
                max_files,
                max_file_bytes,
                max_total_bytes,
                max_path_bytes,
                max_path_component_bytes,
                max_diagnostic_snippets_per_case,
                max_diagnostic_snippet_bytes,
                max_diagnostic_total_bytes,
            )?,
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

impl TryFrom<RawObservabilitySettings> for ObservabilitySettings {
    type Error = SettingsError;

    fn try_from(raw: RawObservabilitySettings) -> Result<Self, Self::Error> {
        let metrics_bearer_token = raw
            .metrics_bearer_token
            .map(MetricsBearerToken::try_from)
            .transpose()?;

        Ok(Self {
            metrics_enabled: raw.metrics_enabled,
            metrics_bearer_token,
        })
    }
}

fn default_metrics_enabled() -> bool {
    true
}

fn nonzero_usize(field: ConfigField, value: usize) -> Result<NonZeroUsize, SettingsError> {
    NonZeroUsize::new(value).ok_or(SettingsError::NonZero { field })
}

fn nonzero_u64(field: ConfigField, value: u64) -> Result<NonZeroU64, SettingsError> {
    NonZeroU64::new(value).ok_or(SettingsError::NonZero { field })
}

#[cfg(test)]
mod tests {
    use std::{
        fs,
        path::Path,
        sync::{Mutex, MutexGuard},
    };

    use tempfile::tempdir;

    use super::{ConfigField, SettingsError, load_settings_from_dir_with_environment};

    static ENV_LOCK: Mutex<()> = Mutex::new(());

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
  container_cpus: 0.75
  container_pids_limit: 64
  tmp_tmpfs_bytes: 33554432
  process_headroom_bytes: 33554432
  core_ulimit: '1:2'
",
        );

        let settings = load_settings_from_dir_with_environment(root.path(), "local", false)
            .expect("settings should load");

        assert_eq!(settings.server.bind_address.to_string(), "127.0.0.1:19090");
        assert_eq!(
            settings
                .server
                .cors_origin
                .as_ref()
                .expect("cors origin")
                .as_ref(),
            "http://localhost:5173"
        );
        assert_eq!(settings.frontend.dist.as_ref(), Path::new("frontend/dist"));
        assert_eq!(settings.runner.workers.get(), 3);
        assert_eq!(settings.runner.queue_capacity.get(), 20);
        assert_eq!(settings.runner.podman_path.as_ref(), Path::new("podman"));
        assert_eq!(settings.runner.container_cpus.to_string(), "0.75");
        assert_eq!(settings.runner.container_pids_limit.get(), 64);
        assert_eq!(settings.runner.tmp_tmpfs_bytes.get(), 33_554_432);
        assert_eq!(settings.runner.process_headroom_bytes.get(), 33_554_432);
        assert_eq!(settings.runner.core_ulimit.to_string(), "core=1:2");
        assert_eq!(settings.validation.limits.max_files(), 8);
        assert!(settings.observability.metrics_enabled);
        assert!(settings.observability.metrics_bearer_token.is_none());
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

        let settings = load_settings_from_dir_with_environment(root.path(), "local", false)
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

        let error = load_settings_from_dir_with_environment(root.path(), "local", false)
            .expect_err("zero workers should fail");

        assert!(matches!(
            error,
            SettingsError::NonZero {
                field: ConfigField::RunnerWorkers
            }
        ));
    }

    #[test]
    fn rejects_tmpfs_that_cannot_fit_in_a_runner_container() {
        let root = tempdir().expect("temp config dir should be created");
        write_config(root.path(), "default.yaml", default_config());
        write_config(
            root.path(),
            "local.yaml",
            "
runner:
  workspace_tmpfs_bytes: 201326593
",
        );

        let error = load_settings_from_dir_with_environment(root.path(), "local", false)
            .expect_err("oversized tmpfs should fail");

        assert!(matches!(
            error,
            SettingsError::Invalid {
                field: ConfigField::RunnerWorkspaceTmpfsBytes,
                ..
            }
        ));
    }

    #[test]
    fn rejects_non_positive_container_cpus() {
        let error = load_with_local_override(
            "
runner:
  container_cpus: 0
",
        )
        .expect_err("non-positive CPU limit should fail");

        assert!(matches!(
            error,
            SettingsError::Invalid {
                field: ConfigField::RunnerContainerCpus,
                ..
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

        let error = load_settings_from_dir_with_environment(root.path(), "local", false)
            .expect_err("invalid validation limits should fail");

        assert!(matches!(error, SettingsError::InvalidValidationLimits(_)));
    }

    #[test]
    fn config_fields_display_stable_paths() {
        let fields = [
            (ConfigField::ServerHost, "server.host"),
            (ConfigField::ServerPort, "server.port"),
            (ConfigField::RunnerQueueCapacity, "runner.queue_capacity"),
            (ConfigField::RunnerWorkers, "runner.workers"),
            (ConfigField::RunnerTimeoutSecs, "runner.timeout_secs"),
            (
                ConfigField::RunnerCleanupTimeoutSecs,
                "runner.cleanup_timeout_secs",
            ),
            (ConfigField::RunnerMaxOutputBytes, "runner.max_output_bytes"),
            (
                ConfigField::RunnerMaxProcessOutputBytes,
                "runner.max_process_output_bytes",
            ),
            (
                ConfigField::RunnerWorkspaceTmpfsBytes,
                "runner.workspace_tmpfs_bytes",
            ),
            (
                ConfigField::RunnerContainerMemoryBytes,
                "runner.container_memory_bytes",
            ),
            (ConfigField::RunnerContainerCpus, "runner.container_cpus"),
            (
                ConfigField::RunnerContainerPidsLimit,
                "runner.container_pids_limit",
            ),
            (ConfigField::RunnerTmpTmpfsBytes, "runner.tmp_tmpfs_bytes"),
            (
                ConfigField::RunnerProcessHeadroomBytes,
                "runner.process_headroom_bytes",
            ),
            (ConfigField::RunnerCoreUlimit, "runner.core_ulimit"),
            (ConfigField::RunnerImage, "runner.image"),
            (ConfigField::RunnerWorkspaceRoot, "runner.workspace_root"),
            (ConfigField::RunnerPodmanPath, "runner.podman_path"),
            (ConfigField::FrontendDist, "frontend.dist"),
            (ConfigField::ServerCorsOrigin, "server.cors_origin"),
            (ConfigField::ValidationMaxFiles, "validation.max_files"),
            (
                ConfigField::ValidationMaxFileBytes,
                "validation.max_file_bytes",
            ),
            (
                ConfigField::ValidationMaxTotalBytes,
                "validation.max_total_bytes",
            ),
            (
                ConfigField::ValidationMaxPathBytes,
                "validation.max_path_bytes",
            ),
            (
                ConfigField::ValidationMaxPathComponentBytes,
                "validation.max_path_component_bytes",
            ),
            (
                ConfigField::ValidationMaxDiagnosticSnippetsPerCase,
                "validation.max_diagnostic_snippets_per_case",
            ),
            (
                ConfigField::ValidationMaxDiagnosticSnippetBytes,
                "validation.max_diagnostic_snippet_bytes",
            ),
            (
                ConfigField::ValidationMaxDiagnosticTotalBytes,
                "validation.max_diagnostic_total_bytes",
            ),
            (
                ConfigField::ApiMaxJsonPayloadBytes,
                "api.max_json_payload_bytes",
            ),
            (
                ConfigField::ObservabilityMetricsBearerToken,
                "observability.metrics_bearer_token",
            ),
        ];

        for (field, expected) in fields {
            assert_eq!(field.to_string(), expected);
        }
    }

    #[test]
    fn rejects_empty_required_text_fields() {
        let cases = [
            (
                "
server:
  host: '   '
",
                ConfigField::ServerHost,
            ),
            (
                "
runner:
  image: '   '
",
                ConfigField::RunnerImage,
            ),
            (
                "
runner:
  workspace_root: ''
",
                ConfigField::RunnerWorkspaceRoot,
            ),
            (
                "
runner:
  podman_path: ''
",
                ConfigField::RunnerPodmanPath,
            ),
            (
                "
runner:
  core_ulimit: ''
",
                ConfigField::RunnerCoreUlimit,
            ),
            (
                "
frontend:
  dist: ''
",
                ConfigField::FrontendDist,
            ),
            (
                "
observability:
  metrics_bearer_token: ''
",
                ConfigField::ObservabilityMetricsBearerToken,
            ),
        ];

        for (override_config, expected_field) in cases {
            let error = load_with_local_override(override_config)
                .expect_err("empty config field should fail");

            assert!(matches!(
                error,
                SettingsError::Empty { field } if field == expected_field
            ));
        }
    }

    #[test]
    fn rejects_zero_required_numeric_fields() {
        let cases = [
            (
                "
runner:
  queue_capacity: 0
",
                ConfigField::RunnerQueueCapacity,
            ),
            (
                "
runner:
  timeout_secs: 0
",
                ConfigField::RunnerTimeoutSecs,
            ),
            (
                "
runner:
  max_output_bytes: 0
",
                ConfigField::RunnerMaxOutputBytes,
            ),
            (
                "
runner:
  container_pids_limit: 0
",
                ConfigField::RunnerContainerPidsLimit,
            ),
            (
                "
runner:
  tmp_tmpfs_bytes: 0
",
                ConfigField::RunnerTmpTmpfsBytes,
            ),
            (
                "
runner:
  process_headroom_bytes: 0
",
                ConfigField::RunnerProcessHeadroomBytes,
            ),
            (
                "
validation:
  max_files: 0
",
                ConfigField::ValidationMaxFiles,
            ),
            (
                "
validation:
  max_file_bytes: 0
",
                ConfigField::ValidationMaxFileBytes,
            ),
            (
                "
validation:
  max_total_bytes: 0
",
                ConfigField::ValidationMaxTotalBytes,
            ),
            (
                "
api:
  max_json_payload_bytes: 0
",
                ConfigField::ApiMaxJsonPayloadBytes,
            ),
        ];

        for (override_config, expected_field) in cases {
            let error = load_with_local_override(override_config)
                .expect_err("zero config field should fail");

            assert!(matches!(
                error,
                SettingsError::NonZero { field } if field == expected_field
            ));
        }
    }

    #[test]
    fn nested_environment_overrides_are_loaded() {
        let _guard = EnvGuard::set(&[
            ("RUST_DAILY_SERVER__HOST", "0.0.0.0"),
            ("RUST_DAILY_SERVER__PORT", "18080"),
            ("RUST_DAILY_SERVER__CORS_ORIGIN", "https://example.test"),
            ("RUST_DAILY_FRONTEND__DIST", "dist/prod"),
            ("RUST_DAILY_RUNNER__QUEUE_CAPACITY", "7"),
            ("RUST_DAILY_RUNNER__WORKERS", "4"),
            ("RUST_DAILY_RUNNER__TIMEOUT_SECS", "9"),
            ("RUST_DAILY_RUNNER__MAX_OUTPUT_BYTES", "12345"),
            ("RUST_DAILY_RUNNER__IMAGE", "runner:test"),
            ("RUST_DAILY_RUNNER__WORKSPACE_ROOT", "/tmp/workspaces"),
            ("RUST_DAILY_RUNNER__PODMAN_PATH", "/usr/bin/podman"),
            ("RUST_DAILY_VALIDATION__MAX_FILES", "6"),
            ("RUST_DAILY_VALIDATION__MAX_FILE_BYTES", "7000"),
            ("RUST_DAILY_VALIDATION__MAX_TOTAL_BYTES", "8000"),
            ("RUST_DAILY_API__MAX_JSON_PAYLOAD_BYTES", "70000"),
            ("RUST_DAILY_OBSERVABILITY__METRICS_ENABLED", "false"),
            (
                "RUST_DAILY_OBSERVABILITY__METRICS_BEARER_TOKEN",
                "local-secret",
            ),
        ]);
        let root = tempdir().expect("temp config dir should be created");
        write_config(root.path(), "default.yaml", default_config());

        let settings = load_settings_from_dir_with_environment(root.path(), "local", true)
            .expect("nested environment should override config");

        assert_eq!(settings.server.bind_address.to_string(), "0.0.0.0:18080");
        assert_eq!(
            settings
                .server
                .cors_origin
                .as_ref()
                .map(|value| value.as_ref()),
            Some("https://example.test")
        );
        assert_eq!(settings.frontend.dist.as_ref(), Path::new("dist/prod"));
        assert_eq!(settings.runner.queue_capacity.get(), 7);
        assert_eq!(settings.runner.workers.get(), 4);
        assert_eq!(settings.runner.timeout.as_secs(), 9);
        assert_eq!(settings.runner.max_output_bytes.get(), 12345);
        assert_eq!(settings.runner.image.as_ref(), "runner:test");
        assert_eq!(
            settings.runner.workspace_root.as_ref(),
            Path::new("/tmp/workspaces")
        );
        assert_eq!(
            settings.runner.podman_path.as_ref(),
            Path::new("/usr/bin/podman")
        );
        assert_eq!(settings.validation.limits.max_files(), 6);
        assert_eq!(settings.validation.limits.max_file_bytes(), 7000);
        assert_eq!(settings.validation.limits.max_total_bytes(), 8000);
        assert_eq!(settings.api.max_json_payload_bytes.get(), 70000);
        assert!(!settings.observability.metrics_enabled);
        assert_eq!(
            settings
                .observability
                .metrics_bearer_token
                .as_ref()
                .expect("metrics token")
                .as_ref(),
            "local-secret"
        );
    }

    #[test]
    fn nested_environment_numbers_must_parse() {
        let _guard = EnvGuard::set(&[("RUST_DAILY_SERVER__PORT", "not-a-number")]);
        let root = tempdir().expect("temp config dir should be created");
        write_config(root.path(), "default.yaml", default_config());

        let error = load_settings_from_dir_with_environment(root.path(), "local", true)
            .expect_err("bad env number should fail");

        assert!(matches!(error, SettingsError::Load(_)));
    }

    #[test]
    fn rejects_json_limit_below_validation_contract() {
        let error = load_with_local_override("\napi:\n  max_json_payload_bytes: 1048576\n")
            .expect_err("transport limit below the domain envelope should fail");

        assert!(matches!(
            error,
            SettingsError::Invalid {
                field: ConfigField::ApiMaxJsonPayloadBytes,
                ..
            }
        ));
    }

    #[test]
    fn rejects_null_metrics_enabled() {
        for config in [
            "\nobservability:\n  metrics_enabled:\n",
            "\nobservability:\n  metrics_enabled: null\n",
        ] {
            let error = load_with_local_override(config)
                .expect_err("explicit null metrics enablement should fail closed");

            assert!(matches!(error, SettingsError::Load(_)));
        }
    }

    #[test]
    fn missing_observability_defaults_metrics_enabled() {
        let root = tempdir().expect("temp config dir should be created");
        write_config(
            root.path(),
            "default.yaml",
            &default_config().replace(
                "observability:\n  metrics_enabled: true\n  metrics_bearer_token: null\n",
                "",
            ),
        );
        write_config(root.path(), "local.yaml", "");

        let settings = load_settings_from_dir_with_environment(root.path(), "local", false)
            .expect("settings should load");

        assert!(settings.observability.metrics_enabled);
        assert!(settings.observability.metrics_bearer_token.is_none());
    }

    fn load_with_local_override(override_config: &str) -> Result<super::Settings, SettingsError> {
        let root = tempdir().expect("temp config dir should be created");
        write_config(root.path(), "default.yaml", default_config());
        write_config(root.path(), "local.yaml", override_config);

        load_settings_from_dir_with_environment(root.path(), "local", false)
    }

    fn write_config(root: &Path, name: &str, contents: &str) {
        fs::write(root.join(name), contents).expect("test config should be written");
    }

    struct EnvGuard {
        _lock: MutexGuard<'static, ()>,
        names: Vec<&'static str>,
    }

    impl EnvGuard {
        fn set(values: &[(&'static str, &'static str)]) -> Self {
            let lock = ENV_LOCK.lock().expect("env test lock should be acquired");
            let names = values.iter().map(|(name, _)| *name).collect::<Vec<_>>();

            for name in &names {
                remove_env(name);
            }

            for (name, value) in values {
                set_env(name, value);
            }

            Self { _lock: lock, names }
        }
    }

    impl Drop for EnvGuard {
        fn drop(&mut self) {
            for name in &self.names {
                remove_env(name);
            }
        }
    }

    fn set_env(name: &str, value: &str) {
        // SAFETY: These tests serialize environment mutation through ENV_LOCK and
        // remove every key before releasing the guard.
        unsafe {
            std::env::set_var(name, value);
        }
    }

    fn remove_env(name: &str) {
        // SAFETY: These tests serialize environment mutation through ENV_LOCK and
        // remove every key before releasing the guard.
        unsafe {
            std::env::remove_var(name);
        }
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
  cleanup_timeout_secs: 2
  max_output_bytes: 65536
  max_process_output_bytes: 4194304
  workspace_tmpfs_bytes: 134217728
  container_memory_bytes: 268435456
  container_cpus: 0.5
  container_pids_limit: 128
  tmp_tmpfs_bytes: 67108864
  process_headroom_bytes: 67108864
  core_ulimit: '0:0'
  image: rust-runner:1.95
  workspace_root: /tmp/rust-daily-runs
  podman_path: podman
validation:
  max_files: 8
  max_file_bytes: 65536
  max_total_bytes: 262144
  max_path_bytes: 240
  max_path_component_bytes: 120
  max_diagnostic_snippets_per_case: 16
  max_diagnostic_snippet_bytes: 512
  max_diagnostic_total_bytes: 8192
api:
  max_json_payload_bytes: 1600000
observability:
  metrics_enabled: true
  metrics_bearer_token: null
"
    }
}
