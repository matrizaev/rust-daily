use rust_daily_lesson::{status_code, CreateOrderError, CreateOrderUseCaseError, RepositoryError};

#[test]
fn maps_errors_to_boundary_statuses() {
    assert_eq!(status_code(&CreateOrderUseCaseError::from(CreateOrderError::EmptyOrder)), 400);
    assert_eq!(status_code(&CreateOrderUseCaseError::from(RepositoryError::Conflict)), 409);
    assert_eq!(status_code(&CreateOrderUseCaseError::from(RepositoryError::Unavailable)), 503);
}
