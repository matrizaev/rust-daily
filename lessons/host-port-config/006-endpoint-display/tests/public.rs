use rust_daily_lesson::{Endpoint, Host, Port};

#[test]
fn endpoint_display() -> Result<(), String> {
    let host = Host::try_from("127.0.0.1")
        .map_err(|error| format!("invalid test host: {error:?}"))?;
    let endpoint = Endpoint::new(host, Port::HTTP);

    assert_eq!(endpoint.to_string(), "127.0.0.1:80");

    Ok(())
}
