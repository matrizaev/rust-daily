use std::error::Error;

use rust_daily_lesson::{parse_user, ParseUserError};

#[test]
fn preserves_parse_int_error_source_value() -> Result<(), String> {
    match parse_user("not-a-number,Ada,ada@example.com") {
        Err(ParseUserError::InvalidId(source)) => {
            assert!(source.to_string().contains("invalid digit"));
            Ok(())
        }
        other => Err(format!("unexpected parse result: {other:?}")),
    }
}

#[test]
fn exposes_parse_int_error_as_source() {
    let error = parse_user("not-a-number,Ada,ada@example.com").unwrap_err();

    assert!(error.source().is_some());
}
