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

pub fn load_port(lookup: impl Fn(&str) -> Option<String>) -> Result<u16, ConfigLoadError> {
    let raw = lookup("APP_PORT").ok_or(ConfigLoadError::MissingEnvironment)?;
    let port = parse_port(raw.as_str())?;

    Ok(port)
}
