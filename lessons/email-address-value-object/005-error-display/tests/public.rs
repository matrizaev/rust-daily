use rust_daily_lesson::EmailValidationError;

fn assert_error<E: std::error::Error>() {}

#[test]
fn validation_error_is_a_standard_error() {
    assert_error::<EmailValidationError>();
}

#[test]
fn display_messages_are_human_readable() {
    assert_eq!(EmailValidationError::Empty.to_string(), "email address is empty");
    assert_eq!(
        EmailValidationError::MissingAt.to_string(),
        "email address is missing @"
    );
    assert_eq!(
        EmailValidationError::MissingDomain.to_string(),
        "email address is missing a domain"
    );
}
