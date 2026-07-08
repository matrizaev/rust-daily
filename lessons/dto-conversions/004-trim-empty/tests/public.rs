use rust_daily_lesson::{RegisterUserCommand, RegisterUserDto, RegisterUserValidationError};

#[test]
fn trims_deserialized_fields_before_storing_command() {
    let dto: RegisterUserDto = serde_json::from_str(
        r#"{"email":"  ada@example.com  ","display_name":"  Ada  "}"#,
    )
    .expect("DTO JSON should deserialize");

    let command = RegisterUserCommand::try_from(dto).expect("DTO should be valid");

    assert_eq!(command.email(), "ada@example.com");
    assert_eq!(command.display_name(), "Ada");
}

#[test]
fn rejects_trimmed_empty_email() {
    let dto = RegisterUserDto {
        email: Some("   ".to_owned()),
        display_name: Some("Ada".to_owned()),
    };

    assert_eq!(
        RegisterUserCommand::try_from(dto),
        Err(RegisterUserValidationError::EmptyEmail)
    );
}
