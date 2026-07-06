use rust_daily_lesson::RepositoryError;

#[test]
fn repository_errors_format_safely() {
    assert_eq!(RepositoryError::Unavailable.to_string(), "repository unavailable");
    assert_eq!(RepositoryError::Conflict.to_string(), "repository conflict");
}
