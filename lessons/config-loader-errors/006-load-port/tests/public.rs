use rust_daily_lesson::{load_port, ConfigLoadError};

#[test]
fn loads_port_from_lookup() {
    assert_eq!(load_port(|_| Some("8080".to_owned())), Ok(8080));
}

#[test]
fn reports_missing_and_invalid_port() {
    assert_eq!(load_port(|_| None), Err(ConfigLoadError::MissingEnvironment));
    assert_eq!(load_port(|_| Some("abc".to_owned())), Err(ConfigLoadError::InvalidPort));
}
