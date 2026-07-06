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

impl TryFrom<String> for Host {
    type Error = HostValidationError;

    fn try_from(val: String) -> Result<Self, Self::Error> {
        if val.is_empty() {
            return Err(HostValidationError::Empty);
        }
        if val.contains(' ') {
            return Err(HostValidationError::InvalidCharacters);
        }
        Ok(Self(val))
    }
}
