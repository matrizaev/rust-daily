#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Config {
    pub service_url: String,
    pub max_connections: usize,
    pub use_tls: bool,
}

// Continue from the previous lesson.
// TODO: implement Default for Config.
