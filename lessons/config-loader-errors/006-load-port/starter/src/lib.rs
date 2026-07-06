use std::num::ParseIntError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ConfigLoadError {
    MissingEnvironment,
    InvalidPort,
}

impl From<ParseIntError> for ConfigLoadError {
    fn from(_error: ParseIntError) -> Self {
        ConfigLoadError::InvalidPort
    }
}

pub fn parse_port(value: &str) -> Result<u16, ConfigLoadError> {
    Ok(value.parse::<u16>()?)
}

// TODO: implement load_port using the provided lookup function.
