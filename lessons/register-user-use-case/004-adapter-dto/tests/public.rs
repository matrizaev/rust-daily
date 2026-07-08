use rust_daily_lesson::{adapters::RegisterUserRequest, domain::RegisterUserCommand};

#[test]
fn deserializes_and_converts_adapter_request() {
    let request: RegisterUserRequest = serde_json::from_str(
        r#"{"email":" ada@example.com ","display_name":" Ada "}"#,
    )
    .expect("request JSON should deserialize");

    let command = RegisterUserCommand::try_from(request).expect("request should be valid");

    assert_eq!(command.email().as_str(), "ada@example.com");
    assert_eq!(command.display_name(), "Ada");
}
