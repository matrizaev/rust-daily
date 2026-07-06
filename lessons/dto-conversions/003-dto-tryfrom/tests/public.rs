use rust_daily_lesson::{RegisterUserCommand, RegisterUserDto, RegisterUserValidationError};

#[test]
fn converts_complete_dto() {
    let command = RegisterUserCommand::try_from(RegisterUserDto {
        email: Some("ada@example.com".to_owned()),
        display_name: Some("Ada".to_owned()),
    });

    assert_eq!(command.map(|command| command.email().to_owned()), Ok("ada@example.com".to_owned()));
}

#[test]
fn reports_missing_dto_fields() {
    assert_eq!(
        RegisterUserCommand::try_from(RegisterUserDto { email: None, display_name: Some("Ada".to_owned()) }),
        Err(RegisterUserValidationError::MissingEmail)
    );
}
