use rust_daily_lesson::{RegisterUserCommand, RegisterUserDto};

#[test]
fn command_has_private_state_and_borrowed_accessors() {
    let command = RegisterUserCommand::new("ada@example.com", "Ada");

    assert_eq!(command.email(), "ada@example.com");
    assert_eq!(command.display_name(), "Ada");
}

#[test]
fn dto_still_deserializes_at_the_boundary() {
    let dto: RegisterUserDto = serde_json::from_str(r#"{"email":"ada@example.com"}"#)
        .expect("DTO JSON should deserialize");

    assert_eq!(dto.email.as_deref(), Some("ada@example.com"));
}
