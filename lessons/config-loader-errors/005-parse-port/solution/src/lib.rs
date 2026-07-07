use std::error::Error;
use std::fmt;
use std::io;

use std::num::ParseIntError;

#[derive(Debug)]
pub enum ConfigLoadError {
    MissingEnvironment,
    InvalidPort(ParseIntError),
    FileRead(io::Error),
}

impl From<ParseIntError> for ConfigLoadError {
    fn from(error: ParseIntError) -> Self {
        ConfigLoadError::InvalidPort(error)
    }
}

pub fn parse_port(value: &str) -> Result<u16, ConfigLoadError> {
    let port = value.parse::<u16>()?;

    Ok(port)
}

impl fmt::Display for ConfigLoadError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfigLoadError::MissingEnvironment => write!(f, "missing environment"),
            ConfigLoadError::InvalidPort(_) => write!(f, "invalid port"),
            ConfigLoadError::FileRead(_) => write!(f, "could not read config file"),
        }
    }
}

impl Error for ConfigLoadError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            ConfigLoadError::FileRead(error) => Some(error),
            ConfigLoadError::InvalidPort(error) => Some(error),
            ConfigLoadError::MissingEnvironment => None,
        }
    }
}

impl From<io::Error> for ConfigLoadError {
    fn from(error: io::Error) -> Self {
        ConfigLoadError::FileRead(error)
    }
}
