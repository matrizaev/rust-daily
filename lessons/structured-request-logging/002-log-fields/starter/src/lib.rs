pub fn log_request_received(request_id: &str) {
    tracing::info!(
        event_name = "request.received",
        request_id = %request_id,
        "request received"
    );
}

// TODO: add request_id, user_id, and attempt fields.
