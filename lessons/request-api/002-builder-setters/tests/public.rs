use rust_daily_lesson::RequestBuilder;

#[test]
fn method_setter_is_chainable() {
    let _builder = RequestBuilder::new().method("GET");
}
