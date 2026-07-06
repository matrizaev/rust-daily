use rust_daily_lesson::Port;

#[test]
fn port_safety() {
    assert!(Port::new(8080).is_some());
    assert!(Port::new(0).is_none());
}
