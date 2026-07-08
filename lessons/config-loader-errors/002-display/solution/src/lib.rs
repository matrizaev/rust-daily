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

impl ConfigLoadError {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::MissingEnvironment => "missing_environment",
            Self::InvalidPort => "invalid_port",
            Self::FileRead => "file_read",
        }
    }
}
