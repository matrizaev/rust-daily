use rust_daily_lesson::RepositoryError;

#[test]
fn repository_errors_have_boundary_specific_messages() {
    assert_eq!(RepositoryError::Unavailable.to_string(), "repository is unavailable");
    assert_eq!(RepositoryError::Conflict.to_string(), "order conflicts with existing data");
}
