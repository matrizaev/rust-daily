use rust_daily_lesson::Endpoint;

#[test]
fn endpoint_default() {
    let default_endpoint = Endpoint::default();

    assert_eq!(default_endpoint.host().as_str(), "localhost");
    assert_eq!(default_endpoint.port().value(), 8080);
}
