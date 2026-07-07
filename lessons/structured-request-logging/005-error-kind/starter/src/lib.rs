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
pub struct LogEvent {
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
        Self { request_id: request_id.into(), path: path.into() }
    }

    pub fn event(&self, event_name: impl Into<String>) -> LogEvent {
        LogEvent {
            event_name: event_name.into(),
            request_id: self.request_id.clone(),
            path: self.path.clone(),
        }
    }
}


impl fmt::Display for Secret {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "[redacted]")
    }
}

// Continue from the previous lesson.
// TODO: implement error_event.
