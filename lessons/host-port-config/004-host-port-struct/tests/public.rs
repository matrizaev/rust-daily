use rust_daily_lesson::{Endpoint, Host, Port};

fn valid_host() -> Result<Host, String> {
    Host::try_from("127.0.0.1").map_err(|error| format!("invalid test host: {error:?}"))
}

fn valid_port() -> Result<Port, String> {
    Port::new(80).ok_or_else(|| "port fixture must be non-zero".to_owned())
}

#[test]
fn endpoint_composites() -> Result<(), String> {
    let host = valid_host()?;
    let port = valid_port()?;
    let endpoint = Endpoint::new(host.clone(), port);

    assert_eq!(endpoint.host(), &host);
    assert_eq!(endpoint.port(), port);

    Ok(())
}
