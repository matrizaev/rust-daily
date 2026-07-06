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
