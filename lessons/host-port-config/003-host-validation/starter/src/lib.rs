#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

fn validate_host(value: &str) -> Result<(), HostValidationError> {
    if value.is_empty() {
        return Err(HostValidationError::Empty);
    }

    if value.contains(char::is_whitespace) {
        return Err(HostValidationError::InvalidCharacters);
    }

    Ok(())
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
        validate_host(value)?;

        Ok(Self(value.to_owned()))
    }
}

// TODO: Implement TryFrom<String> for Host by reusing validate_host without reallocating the String.
