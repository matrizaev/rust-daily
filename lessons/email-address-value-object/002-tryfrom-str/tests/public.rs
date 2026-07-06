use rust_daily_lesson::{EmailAddress, EmailValidationError};

#[test]
fn accepts_text_with_at_sign() -> Result<(), EmailValidationError> {
    let email = EmailAddress::try_from("ada@example.com")?;

    assert_eq!(email.as_str(), "ada@example.com");

    Ok(())
}

#[test]
fn rejects_empty_text() {
    assert_eq!(EmailAddress::try_from(""), Err(EmailValidationError::Empty));
}

#[test]
fn rejects_text_without_at_sign() {
    assert_eq!(
        EmailAddress::try_from("ada.example.com"),
        Err(EmailValidationError::MissingAt)
    );
}
