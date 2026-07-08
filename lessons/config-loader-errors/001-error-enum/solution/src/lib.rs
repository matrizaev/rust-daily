use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort,
    #[error("failed to read config file")]
    FileRead,
}
