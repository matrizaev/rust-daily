use rust_daily_lesson::{parse_id, ParseUserError};

#[test]
fn parses_valid_id() {
    assert!(matches!(parse_id("42"), Ok(42)));
}

#[test]
fn converts_parse_int_error() {
    assert!(matches!(parse_id("nope"), Err(ParseUserError::InvalidId(_))));
}
