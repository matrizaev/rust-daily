pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
}

impl Config {
    pub fn with_service_url(mut self, service_url: impl Into<String>) -> Self {
        self.service_url = service_url.into();
        self
    }
}
