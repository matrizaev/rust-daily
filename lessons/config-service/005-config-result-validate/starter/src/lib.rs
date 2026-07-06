pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
}

pub enum ConfigError {
    // TODO: add validation error variants.
}

impl Config {
    pub fn validate(&self) -> bool {
        !self.service_url.is_empty() && self.max_connections > 0
    }
}
