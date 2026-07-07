pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            service_url: "http://localhost:8080".to_owned(),
            max_connections: 32,
            use_tls: false,
        }
    }
}

// Continue from the previous lesson.
// TODO: add with_service_url here.
