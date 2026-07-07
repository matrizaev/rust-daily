pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
    pub timeout_seconds: Option<u64>,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            service_url: "http://localhost:8080".to_owned(),
            max_connections: 32,
            use_tls: false,
            timeout_seconds: None,
        }
    }
}

impl Config {
    pub fn with_service_url(mut self, service_url: impl Into<String>) -> Self {
        self.service_url = service_url.into();
        self
    }
}

// Continue from the previous lesson.
// TODO: add validation error variants.
