use rust_daily_lesson::{Endpoint, Host, Port};

fn main() {
    let host = Host::try_from("localhost").unwrap();
    let port = Port::new(8080).unwrap();
    let _ = Endpoint { host, port };
}
