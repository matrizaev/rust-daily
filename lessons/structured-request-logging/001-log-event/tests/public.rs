use rust_daily_lesson::log_request_received;

#[test]
fn structured_event_function_is_callable_without_subscriber() {
    log_request_received("req-1");
}
