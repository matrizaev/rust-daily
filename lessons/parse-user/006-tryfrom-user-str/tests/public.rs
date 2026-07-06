use rust_daily_lesson::{ParseUserError, User};

#[test]
fn tryfrom_parses_valid_user() {
    assert_eq!(
        User::try_from("42,Ada,ada@example.com"),
        Ok(User {
            id: 42,
            name: "Ada".to_owned(),
            email: "ada@example.com".to_owned(),
        })
    );
}

#[test]
fn tryfrom_returns_parse_errors() {
    assert_eq!(User::try_from(""), Err(ParseUserError::MissingId));
    assert_eq!(User::try_from("42,Ada"), Err(ParseUserError::MissingEmail));
}
