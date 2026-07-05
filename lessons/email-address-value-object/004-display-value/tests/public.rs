use rust_daily_lesson::EmailAddress;

#[test]
fn display_uses_the_email_text() {
    let email = EmailAddress::new_unchecked("ada@example.com");

    assert_eq!(email.to_string(), "ada@example.com");
}
