use rust_daily_lesson::{log_authentication_attempt, Secret};

#[test]
fn secret_display_is_always_redacted() {
    let secret = Secret::new("correct horse battery staple");

    assert_eq!(secret.to_string(), "[redacted]");
    assert!(!secret.is_empty());
    log_authentication_attempt("req-1", secret);
}
