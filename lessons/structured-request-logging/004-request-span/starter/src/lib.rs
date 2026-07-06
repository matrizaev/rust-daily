#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogEvent {
    pub event_name: String,
    pub request_id: String,
    pub path: String,
}

// TODO: define RequestSpan and build events from it.
