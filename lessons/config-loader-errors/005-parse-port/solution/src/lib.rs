use thiserror::Error;

#[derive(Debug, Error)]
pub enum ConfigLoadError {
    #[error("missing APP_PORT")]
    MissingEnvironment,
    #[error("invalid APP_PORT")]
    InvalidPort(#[from] std::num::ParseIntError),
    #[error("failed to read config file")]
    FileRead(#[from] std::io::Error),
}

impl ConfigLoadError {
    pub fn kind(&self) -> &'static str {
        match self {
            Self::MissingEnvironment => "missing_environment",
            Self::InvalidPort(_) => "invalid_port",
            Self::FileRead(_) => "file_read",
        }
    }
}

pub fn parse_port(value: &str) -> Result<u16, ConfigLoadError> {
    Ok(value.parse()?)
}
