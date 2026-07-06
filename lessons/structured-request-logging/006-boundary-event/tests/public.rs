use rust_daily_lesson::register_attempt_event;

#[test]
fn application_boundary_event_has_operational_fields() {
    let event = register_attempt_event("req-1", Some("user-1".to_owned()), true);

    assert_eq!(event.event_name, "register_user.attempt");
    assert_eq!(event.request_id, "req-1");
    assert_eq!(event.user_id, Some("user-1".to_owned()));
    assert!(event.success);
}
