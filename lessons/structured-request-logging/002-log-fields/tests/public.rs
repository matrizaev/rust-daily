use rust_daily_lesson::log_request_started;

#[test]
fn request_fields_support_known_and_anonymous_users() {
    log_request_started("req-1", Some("user-7"), 1);
    log_request_started("req-2", None, 2);
}
