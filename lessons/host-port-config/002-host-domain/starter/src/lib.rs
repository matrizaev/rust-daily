#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

// TODO: Define Host as a public tuple struct with a private String field.

impl Host {
    // TODO: Expose as_str(&self) -> &str.
}

// TODO: Implement TryFrom<&str> for Host.
