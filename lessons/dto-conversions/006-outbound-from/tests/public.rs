use rust_daily_lesson::{UserRegistered, UserRegisteredDto};

#[test]
fn serializes_outbound_dto_shape() {
    let dto = UserRegisteredDto::from(UserRegistered {
        user_id: 42,
        email: "ada@example.com".to_owned(),
    });

    let json = serde_json::to_value(&dto).expect("DTO should serialize");

    assert_eq!(
        json,
        serde_json::json!({
            "id": "42",
            "email": "ada@example.com"
        })
    );
}
