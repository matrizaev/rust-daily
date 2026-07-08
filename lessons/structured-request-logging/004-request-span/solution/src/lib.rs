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
    pub path: String,
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

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RequestSpan {
    request_id: String,
    path: String,
}

impl RequestSpan {
    pub fn new(request_id: impl Into<String>, path: impl Into<String>) -> Self {
        Self {
            request_id: request_id.into(),
            path: path.into(),
        }
    }

    pub fn event(&self, event_name: impl Into<String>) -> LogEvent {
        LogEvent {
            event_name: event_name.into(),
            level: LogLevel::Info,
            fields: LogFields {
                request_id: self.request_id.clone(),
                user_id: None,
                attempt: 1,
                path: self.path.clone(),
            },
        }
    }
}
