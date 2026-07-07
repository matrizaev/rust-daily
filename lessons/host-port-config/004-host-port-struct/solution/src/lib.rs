use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

fn validate_host(value: &str) -> Result<(), HostValidationError> {
    if value.is_empty() {
        return Err(HostValidationError::Empty);
    }

    if value.contains(char::is_whitespace) {
        return Err(HostValidationError::InvalidCharacters);
    }

    Ok(())
}

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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HostValidationError {
    Empty,
    InvalidCharacters,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Endpoint {
    host: Host,
    port: Port,
}

impl Endpoint {
    pub fn new(host: Host, port: Port) -> Self {
        Self { host, port }
    }

    pub fn host(&self) -> &Host {
        &self.host
    }

    pub fn port(&self) -> Port {
        self.port
    }
}


impl TryFrom<String> for Host {
    type Error = HostValidationError;

    fn try_from(value: String) -> Result<Self, Self::Error> {
        validate_host(value.as_str())?;

        Ok(Self(value))
    }
}
