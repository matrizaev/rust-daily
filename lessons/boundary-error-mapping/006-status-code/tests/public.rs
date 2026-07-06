use rust_daily_lesson::{status_code, CreateOrderError, CreateOrderUseCaseError, RepositoryError};

#[test]
fn maps_application_errors_at_http_edge() {
    assert_eq!(status_code(&CreateOrderUseCaseError::Domain(CreateOrderError::InvalidQuantity)), 400);
    assert_eq!(status_code(&CreateOrderUseCaseError::Repository(RepositoryError::Conflict)), 409);
    assert_eq!(status_code(&CreateOrderUseCaseError::Repository(RepositoryError::Unavailable)), 503);
}
