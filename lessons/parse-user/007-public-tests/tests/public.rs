use rust_daily_lesson::{parse_user, ParseUserError, User};

#[test]
fn parser_still_behaves_as_documented() {
    assert_eq!(
        parse_user("7,Grace,grace@example.com"),
        Ok(User {
            id: 7,
            name: "Grace".to_owned(),
            email: "grace@example.com".to_owned(),
        })
    );
    assert_eq!(parse_user("7,Grace"), Err(ParseUserError::MissingEmail));
}
