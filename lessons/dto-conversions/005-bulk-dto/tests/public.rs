use rust_daily_lesson::{
    BulkRegisterCommand, BulkRegisterDto, BulkRegisterError, RegisterUserDto,
    RegisterUserValidationError,
};

#[test]
fn converts_bulk_dto() {
    let bulk = BulkRegisterCommand::try_from(BulkRegisterDto {
        users: vec![RegisterUserDto {
            email: Some("ada@example.com".to_owned()),
            display_name: Some("Ada".to_owned()),
        }],
    });

    assert_eq!(bulk.map(|bulk| bulk.commands().len()), Ok(1));
}

#[test]
fn reports_invalid_user_index() {
    let result = BulkRegisterCommand::try_from(BulkRegisterDto {
        users: vec![RegisterUserDto {
            email: None,
            display_name: Some("Ada".to_owned()),
        }],
    });

    assert!(matches!(
        result,
        Err(BulkRegisterError::InvalidUser {
            index: 0,
            error: RegisterUserValidationError::MissingEmail,
        })
    ));
}
