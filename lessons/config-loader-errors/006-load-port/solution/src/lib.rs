use anyhow::Context;
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

pub fn load_port(
    lookup: impl Fn(&str) -> Option<String>,
) -> Result<u16, ConfigLoadError> {
    let value = lookup("APP_PORT").ok_or(ConfigLoadError::MissingEnvironment)?;

    parse_port(&value)
}

pub fn load_port_with_context(
    lookup: impl Fn(&str) -> Option<String>,
) -> anyhow::Result<u16> {
    load_port(lookup).context("failed to load APP_PORT")
}
