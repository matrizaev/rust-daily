use rust_daily_lesson::{EmailAddress, EmailValidationError};

#[test]
fn rejects_missing_domain() {
    assert_eq!(
        EmailAddress::try_from("ada@"),
        Err(EmailValidationError::MissingDomain)
    );
}

#[test]
fn keeps_other_validation_cases_specific() {
    assert_eq!(EmailAddress::try_from(""), Err(EmailValidationError::Empty));
    assert_eq!(
        EmailAddress::try_from("ada.example.com"),
        Err(EmailValidationError::MissingAt)
    );
}
