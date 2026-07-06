pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
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
