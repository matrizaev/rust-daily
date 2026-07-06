use rust_daily_lesson::Secret;

#[test]
fn secret_display_is_redacted() {
    let secret = Secret::new("token-123");

    assert_eq!(secret.to_string(), "[redacted]");
    assert_eq!(secret.expose(), "token-123");
}
