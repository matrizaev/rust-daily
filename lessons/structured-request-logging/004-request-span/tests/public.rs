use rust_daily_lesson::RequestSpan;

#[test]
fn span_attaches_request_context() {
    let span = RequestSpan::new("req-1", "/users");
    let event = span.event("request.completed");

    assert_eq!(event.event_name, "request.completed");
    assert_eq!(event.request_id, "req-1");
    assert_eq!(event.path, "/users");
}
