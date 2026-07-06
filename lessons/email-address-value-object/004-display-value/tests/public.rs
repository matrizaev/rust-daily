use rust_daily_lesson::{EmailAddress, EmailValidationError};

#[test]
fn display_uses_the_email_text() -> Result<(), EmailValidationError> {
    let email = EmailAddress::try_from("ada@example.com")?;

    assert_eq!(email.to_string(), "ada@example.com");

    Ok(())
}
