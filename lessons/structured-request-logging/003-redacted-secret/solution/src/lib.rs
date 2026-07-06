use std::fmt;

pub struct Secret(String);

impl Secret {
    pub fn new(value: impl Into<String>) -> Self { Self(value.into()) }
    pub fn expose(&self) -> &str { &self.0 }
}

impl fmt::Display for Secret {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[redacted]")
    }
}
