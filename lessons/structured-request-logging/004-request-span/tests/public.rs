use rust_daily_lesson::{LogLevel, RequestSpan, Secret};

#[test]
fn span_attaches_request_context() {
    let span = RequestSpan::new("req-1", "/users");
    let event = span.event("request.completed");

    assert_eq!(event.event_name, "request.completed");
    assert_eq!(event.level, LogLevel::Info);
    assert_eq!(event.fields.request_id, "req-1");
    assert_eq!(event.fields.path, "/users");
    assert_eq!(event.fields.attempt, 1);
    assert_eq!(event.fields.user_id, None);
}

#[test]
fn secret_still_formats_as_redacted() {
    assert_eq!(Secret::new("token-123").to_string(), "[redacted]");
}
