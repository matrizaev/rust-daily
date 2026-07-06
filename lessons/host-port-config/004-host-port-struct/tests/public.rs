use rust_daily_lesson::{Endpoint, Host, Port};

#[test]
fn endpoint_composites() {
    let h = Host::new_unchecked("127.0.0.1".to_owned());
    let p = Port::new(80).unwrap();
    let e = Endpoint::new(h.clone(), p);
    assert_eq!(e.host, h);
    assert_eq!(e.port, p);
}
