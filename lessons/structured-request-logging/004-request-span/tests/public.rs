use rust_daily_lesson::request_span;

#[test]
fn creates_request_span() {
    let _span = request_span("req-1", "/users");
}
