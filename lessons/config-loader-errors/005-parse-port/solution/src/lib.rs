use std::num::ParseIntError;

#[derive(Debug)]
pub enum ConfigLoadError {
    InvalidPort(ParseIntError),
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
