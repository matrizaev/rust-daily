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

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SpanEvent {
    pub event_name: String,
    pub request_id: String,
    pub path: String,
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

    pub fn event(&self, event_name: impl Into<String>) -> SpanEvent {
        SpanEvent {
            event_name: event_name.into(),
            request_id: self.request_id.clone(),
            path: self.path.clone(),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorKind {
    Validation,
    RepositoryUnavailable,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ErrorEvent {
    pub event_name: String,
    pub request_id: String,
    pub error_kind: ErrorKind,
}

pub fn error_event(request_id: impl Into<String>, error_kind: ErrorKind) -> ErrorEvent {
    ErrorEvent {
        event_name: "request.failed".to_owned(),
        request_id: request_id.into(),
        error_kind,
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterAttemptEvent {
    pub event_name: String,
    pub request_id: String,
    pub user_id: Option<String>,
    pub success: bool,
}

pub fn register_attempt_event(
    request_id: impl Into<String>,
    user_id: Option<String>,
    success: bool,
) -> RegisterAttemptEvent {
    RegisterAttemptEvent {
        event_name: "register_user.attempt".to_owned(),
        request_id: request_id.into(),
        user_id,
        success,
    }
}
