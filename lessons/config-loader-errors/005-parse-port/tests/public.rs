use std::error::Error;

use rust_daily_lesson::{parse_port, ConfigLoadError};

#[test]
fn parses_valid_port() {
    assert!(matches!(parse_port("8080"), Ok(8080)));
}

#[test]
fn wraps_parse_port_error() {
    let error = parse_port("abc").unwrap_err();

    assert!(matches!(error, ConfigLoadError::InvalidPort(_)));
    assert_eq!(error.to_string(), "invalid port");
    assert!(error.source().is_some());
}
