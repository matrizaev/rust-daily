use rust_daily_lesson::Port;

#[test]
fn port_safety() {
    assert_eq!(Port::new(8080).map(|port| port.value()), Some(8080));
    assert_eq!(Port::new(0).map(|port| port.value()), None);
}
