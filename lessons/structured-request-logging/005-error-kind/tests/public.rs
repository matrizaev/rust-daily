use rust_daily_lesson::{log_request_error, ErrorKind};

#[test]
fn error_kinds_have_stable_field_values() {
    assert_eq!(ErrorKind::Validation.as_str(), "validation");
    assert_eq!(ErrorKind::Repository.as_str(), "repository");
    assert_eq!(ErrorKind::Timeout.as_str(), "timeout");
    log_request_error("req-1", ErrorKind::Validation);
}
