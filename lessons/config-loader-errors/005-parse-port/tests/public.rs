use rust_daily_lesson::{parse_port, ConfigLoadError};

#[test]
fn parses_valid_port() {
    assert_eq!(parse_port("8080").expect("port should parse"), 8080);
}

#[test]
fn classifies_invalid_port() {
    let error = parse_port("eight").expect_err("text is not a port");

    assert!(matches!(error, ConfigLoadError::InvalidPort(_)));
    assert_eq!(error.kind(), "invalid_port");
}
