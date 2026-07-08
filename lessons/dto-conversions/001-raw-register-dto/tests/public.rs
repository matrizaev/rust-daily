use rust_daily_lesson::RegisterUserDto;

#[test]
fn dto_deserializes_partial_boundary_json() {
    let dto: RegisterUserDto = serde_json::from_str(r#"{"email":"ada@example.com"}"#)
        .expect("DTO JSON should deserialize");

    assert_eq!(dto.email.as_deref(), Some("ada@example.com"));
    assert_eq!(dto.display_name, None);
}
