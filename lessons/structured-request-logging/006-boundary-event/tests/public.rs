use rust_daily_lesson::{error_event, register_attempt_event, ErrorKind};

#[test]
fn application_boundary_event_has_operational_fields() {
    let event = register_attempt_event("req-1", Some("user-1".to_owned()), true);

    assert_eq!(event.event_name, "register_user.attempt");
    assert_eq!(event.request_id, "req-1");
    assert_eq!(event.user_id, Some("user-1".to_owned()));
    assert!(event.success);
}

#[test]
fn previous_error_event_helper_remains_available() {
    let event = error_event("req-2", ErrorKind::Validation);

    assert_eq!(event.fields.error_kind, Some(ErrorKind::Validation));
}
