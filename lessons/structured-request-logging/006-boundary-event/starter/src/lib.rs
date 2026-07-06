#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterAttemptEvent {
    pub event_name: String,
    pub request_id: String,
    pub user_id: Option<String>,
    pub success: bool,
}

// TODO: implement register_attempt_event.
