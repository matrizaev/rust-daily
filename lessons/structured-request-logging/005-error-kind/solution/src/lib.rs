use std::fmt;

pub struct Secret(String);

impl Secret {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }

    pub fn expose(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RequestSpan {
    request_id: String,
    path: String,
}

impl RequestSpan {
    pub fn new(request_id: impl Into<String>, path: impl Into<String>) -> Self {
        Self { request_id: request_id.into(), path: path.into() }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorKind {
    Validation,
    RepositoryUnavailable,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogEvent {
    pub event_name: String,
    pub request_id: String,
    pub error_kind: ErrorKind,
    pub path: String,
}

pub fn error_event(request_id: impl Into<String>, error_kind: ErrorKind) -> LogEvent {
    LogEvent {
        event_name: "request.failed".to_owned(),
        request_id: request_id.into(),
        error_kind,
            path: String::new(),
    }
}


impl fmt::Display for Secret {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[redacted]")
    }
}


impl RequestSpan {
    pub fn event(&self, event_name: impl Into<String>) -> LogEvent {
            LogEvent {
                event_name: event_name.into(),
                request_id: self.request_id.clone(),
                error_kind: ErrorKind::Validation,
                path: self.path.clone(),
            }
        }
}
