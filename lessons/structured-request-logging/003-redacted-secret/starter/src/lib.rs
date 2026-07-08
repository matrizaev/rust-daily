pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

pub fn log_request_started(
    request_id: &str,
    user_id: Option<&str>,
    attempt: u32,
) {
    tracing::info!(
        event_name = "request.started",
        request_id = %request_id,
        user_id = user_id.unwrap_or("anonymous"),
        attempt,
        "request processing started"
    );
}

// TODO: add Secret with redacted Display and log_authentication_attempt.
