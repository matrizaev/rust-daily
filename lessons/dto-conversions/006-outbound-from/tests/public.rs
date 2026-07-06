use rust_daily_lesson::{UserRegistered, UserRegisteredDto};

#[test]
fn converts_domain_event_to_outbound_dto() {
    let dto = UserRegisteredDto::from(UserRegistered {
        user_id: 42,
        email: "ada@example.com".to_owned(),
    });

    assert_eq!(dto.id, "42");
    assert_eq!(dto.email, "ada@example.com");
}
