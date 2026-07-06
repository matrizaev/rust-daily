use rust_daily_lesson::{Endpoint, Host, Port};

#[test]
fn endpoint_default() {
    let def = Endpoint::default();
    assert_eq!(def.host, Host::new_unchecked("localhost".to_owned()));
    assert_eq!(def.port, Port::new(8080).unwrap());
}
