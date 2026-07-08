use rust_daily_lesson::{BulkRegisterCommand, BulkRegisterDto, BulkRegisterError, RegisterUserValidationError};

#[test]
fn deserializes_and_converts_bulk_dto() {
    let dto: BulkRegisterDto = serde_json::from_str(
        r#"{"users":[{"email":"ada@example.com","display_name":"Ada"}]}"#,
    )
    .expect("bulk DTO should deserialize");

    let command = BulkRegisterCommand::try_from(dto).expect("bulk DTO should be valid");

    assert_eq!(command.commands().len(), 1);
    assert_eq!(command.commands()[0].email(), "ada@example.com");
}

#[test]
fn reports_first_invalid_user_index() {
    let dto: BulkRegisterDto = serde_json::from_str(
        r#"{"users":[{"email":"ada@example.com","display_name":"Ada"},{"email":"","display_name":"Grace"}]}"#,
    )
    .expect("bulk DTO should deserialize");

    assert_eq!(
        BulkRegisterCommand::try_from(dto),
        Err(BulkRegisterError::InvalidUser {
            index: 1,
            error: RegisterUserValidationError::EmptyEmail,
        })
    );
}
