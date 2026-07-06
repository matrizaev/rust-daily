use rust_daily_lesson::{error_event, ErrorKind};

#[test]
fn error_event_records_kind_field() {
    let event = error_event("req-1", ErrorKind::RepositoryUnavailable);

    assert_eq!(event.event_name, "request.failed");
    assert_eq!(event.request_id, "req-1");
    assert_eq!(event.error_kind, ErrorKind::RepositoryUnavailable);
}
