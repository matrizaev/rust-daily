pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
    pub timeout_seconds: Option<u64>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ConfigError {
    EmptyServiceUrl,
    ZeroConnections,
}

impl Config {
    pub fn validate(&self) -> Result<(), ConfigError> {
        if self.service_url.is_empty() {
            return Err(ConfigError::EmptyServiceUrl);
        }

        if self.max_connections == 0 {
            return Err(ConfigError::ZeroConnections);
        }

        Ok(())
    }
}

pub fn get_setting<'a>(settings: &'a [(String, String)], key: &str) -> Option<&'a str> {
    settings
        .iter()
        .find(|(name, _value)| name.as_str() == key)
        .map(|(_name, value)| value.as_str())
}
