use rust_daily_lesson::{RegisterUserCommand, RegisterUserDto, RegisterUserValidationError};

#[test]
fn converts_deserialized_dto_into_command() {
    let dto: RegisterUserDto = serde_json::from_str(
        r#"{"email":"ada@example.com","display_name":"Ada"}"#,
    )
    .expect("DTO JSON should deserialize");

    let command = RegisterUserCommand::try_from(dto).expect("DTO should be valid");

    assert_eq!(command.email(), "ada@example.com");
    assert_eq!(command.display_name(), "Ada");
}

#[test]
fn missing_display_name_is_typed_error() {
    let dto: RegisterUserDto = serde_json::from_str(r#"{"email":"ada@example.com"}"#)
        .expect("DTO JSON should deserialize");

    assert_eq!(
        RegisterUserCommand::try_from(dto),
        Err(RegisterUserValidationError::MissingDisplayName)
    );
}
