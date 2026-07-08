use rust_daily_lesson::register_attempt_event;

#[test]
fn emits_success_and_failure_outcomes() {
    register_attempt_event("req-1", Some("user-7"), true);
    register_attempt_event("req-2", None, false);
}
