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

// TODO: implement error_event.
