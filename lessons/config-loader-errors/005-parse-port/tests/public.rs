use rust_daily_lesson::{parse_port, ConfigLoadError};

#[test]
fn parses_valid_port() {
    assert!(matches!(parse_port("8080"), Ok(8080)));
}

#[test]
fn wraps_parse_port_error() {
    assert!(matches!(parse_port("abc"), Err(ConfigLoadError::InvalidPort(_))));
}
