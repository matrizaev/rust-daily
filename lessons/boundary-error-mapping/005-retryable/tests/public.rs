use rust_daily_lesson::{CreateOrderError, CreateOrderUseCaseError, RepositoryError};

#[test]
fn only_repository_unavailability_is_retryable() {
    assert!(CreateOrderUseCaseError::from(RepositoryError::Unavailable).is_retryable());
    assert!(!CreateOrderUseCaseError::from(RepositoryError::Conflict).is_retryable());
    assert!(!CreateOrderUseCaseError::from(CreateOrderError::EmptyOrder).is_retryable());
}
