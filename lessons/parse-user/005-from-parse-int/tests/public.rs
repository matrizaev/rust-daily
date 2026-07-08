use rust_daily_lesson::{parse_user, ParseUserError, User};

#[test]
fn parses_valid_user() {
    assert_eq!(
        parse_user("42,Ada,ada@example.com"),
        Ok(User {
            id: 42,
            name: "Ada".to_owned(),
            email: "ada@example.com".to_owned(),
        })
    );
}

#[test]
fn converts_parse_int_error() {
    assert!(matches!(
        parse_user("nope,Ada,ada@example.com"),
        Err(ParseUserError::InvalidId(_))
    ));
}
