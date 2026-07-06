#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl TryFrom<&str> for Host {
    type Error = HostValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(HostValidationError::Empty);
        }

        if value.contains(char::is_whitespace) {
            return Err(HostValidationError::InvalidCharacters);
        }

        Ok(Self(value.to_owned()))
    }
}
