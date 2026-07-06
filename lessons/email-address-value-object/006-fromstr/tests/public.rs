use rust_daily_lesson::{EmailAddress, EmailValidationError};

#[test]
fn parses_valid_email_with_standard_parse_api() -> Result<(), EmailValidationError> {
    let email = "ada@example.com".parse::<EmailAddress>()?;

    assert_eq!(email.as_str(), "ada@example.com");

    Ok(())
}

#[test]
fn parse_api_returns_the_domain_error() {
    assert_eq!(
        "ada@".parse::<EmailAddress>(),
        Err(EmailValidationError::MissingDomain)
    );
}
