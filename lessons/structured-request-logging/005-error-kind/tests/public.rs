use rust_daily_lesson::{error_event, ErrorKind, LogLevel, RequestSpan};

#[test]
fn error_event_records_kind_field() {
    let event = error_event("req-1", ErrorKind::RepositoryUnavailable);

    assert_eq!(event.event_name, "request.failed");
    assert_eq!(event.level, LogLevel::Error);
    assert_eq!(event.fields.request_id, "req-1");
    assert_eq!(
        event.fields.error_kind,
        Some(ErrorKind::RepositoryUnavailable)
    );
}

#[test]
fn span_events_have_no_error_kind() {
    let event = RequestSpan::new("req-1", "/users").event("request.completed");

    assert_eq!(event.fields.error_kind, None);
    assert_eq!(event.fields.path, "/users");
}
