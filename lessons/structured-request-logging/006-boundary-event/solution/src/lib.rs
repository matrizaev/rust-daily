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
