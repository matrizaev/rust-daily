use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LogLevel {
    Info,
    Warn,
    Error,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogFields {
    pub request_id: String,
    pub user_id: Option<String>,
    pub attempt: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogEvent {
    pub event_name: String,
    pub level: LogLevel,
    pub fields: LogFields,
}

pub struct Secret(String);

impl Secret {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn expose(&self) -> &str {
        &self.0
    }
}

impl fmt::Display for Secret {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[redacted]")
    }
}
