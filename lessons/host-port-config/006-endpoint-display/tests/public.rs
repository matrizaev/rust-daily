use rust_daily_lesson::{Endpoint, Host, Port};

#[test]
fn endpoint_display() {
    let e = Endpoint {
        host: Host::new_unchecked("127.0.0.1".to_owned()),
        port: Port::new(80).unwrap(),
    };
    assert_eq!(e.to_string(), "127.0.0.1:80");
}
