use rust_daily_lesson::ParseUserError;

#[test]
fn formats_parse_errors_for_people() {
    assert_eq!(ParseUserError::MissingId.to_string(), "missing id");
    assert_eq!(ParseUserError::MissingName.to_string(), "missing name");
    assert_eq!(ParseUserError::MissingEmail.to_string(), "missing email");
    assert_eq!(ParseUserError::InvalidId.to_string(), "invalid id");
}
