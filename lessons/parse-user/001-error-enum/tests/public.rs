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
fn returns_named_parse_errors() {
    assert_eq!(parse_user(""), Err(ParseUserError::MissingId));
    assert_eq!(parse_user("42,,ada@example.com"), Err(ParseUserError::MissingName));
    assert_eq!(parse_user("42,Ada"), Err(ParseUserError::MissingEmail));
    assert_eq!(parse_user("nope,Ada,ada@example.com"), Err(ParseUserError::InvalidId));
}
