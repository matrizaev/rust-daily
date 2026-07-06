#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

// TODO: Implement TryFrom<String> for Host.
