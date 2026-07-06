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
}

pub fn error_event(request_id: impl Into<String>, error_kind: ErrorKind) -> LogEvent {
    LogEvent {
        event_name: "request.failed".to_owned(),
        request_id: request_id.into(),
        error_kind,
    }
}
