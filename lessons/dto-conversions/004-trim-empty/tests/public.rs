use rust_daily_lesson::{RegisterUserCommand, RegisterUserDto, RegisterUserValidationError};

#[test]
fn trims_boundary_strings() {
    let command = RegisterUserCommand::try_from(RegisterUserDto {
        email: Some(" ada@example.com ".to_owned()),
        display_name: Some(" Ada ".to_owned()),
    });

    assert_eq!(command.map(|command| command.display_name().to_owned()), Ok("Ada".to_owned()));
}

#[test]
fn rejects_empty_normalized_fields() {
    assert_eq!(
        RegisterUserCommand::try_from(RegisterUserDto { email: Some(" ".to_owned()), display_name: Some("Ada".to_owned()) }),
        Err(RegisterUserValidationError::EmptyEmail)
    );
}
