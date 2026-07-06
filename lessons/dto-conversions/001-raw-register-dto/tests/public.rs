use rust_daily_lesson::RegisterUserDto;

#[test]
fn dto_can_represent_partial_boundary_input() {
    let dto = RegisterUserDto {
        email: Some("ada@example.com".to_owned()),
        display_name: None,
    };

    assert_eq!(dto.email.as_deref(), Some("ada@example.com"));
    assert_eq!(dto.display_name, None);
}
