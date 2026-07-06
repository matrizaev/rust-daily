use rust_daily_lesson::{is_retryable, CreateOrderError, CreateOrderUseCaseError, RepositoryError};

#[test]
fn only_unavailable_repository_errors_are_retryable() {
    assert!(is_retryable(CreateOrderUseCaseError::Repository(RepositoryError::Unavailable)));
    assert!(!is_retryable(CreateOrderUseCaseError::Repository(RepositoryError::Conflict)));
    assert!(!is_retryable(CreateOrderUseCaseError::Domain(CreateOrderError::EmptyOrder)));
}
