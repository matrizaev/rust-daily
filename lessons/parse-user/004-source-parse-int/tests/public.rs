use rust_daily_lesson::{parse_id, ParseUserError};

#[test]
fn preserves_parse_int_error_source_value() -> Result<(), String> {
    match parse_id("not-a-number") {
        Err(ParseUserError::InvalidId(source)) => {
            assert!(source.to_string().contains("invalid digit"));
            Ok(())
        }
        other => Err(format!("unexpected parse result: {other:?}")),
    }
}
