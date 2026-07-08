use rust_daily_lesson::{load_port, load_port_with_context, ConfigLoadError};

#[test]
fn loads_and_parses_port() {
    let port = load_port(|key| (key == "APP_PORT").then(|| "8080".to_owned()))
        .expect("port should load");

    assert_eq!(port, 8080);
}

#[test]
fn missing_value_remains_typed() {
    assert!(matches!(
        load_port(|_| None),
        Err(ConfigLoadError::MissingEnvironment)
    ));
}

#[test]
fn application_boundary_adds_context() {
    let error = load_port_with_context(|_| None).expect_err("port is missing");

    assert!(format!("{error:#}").contains("failed to load APP_PORT"));
    assert!(format!("{error:#}").contains("missing APP_PORT"));
}
