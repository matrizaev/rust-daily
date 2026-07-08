use rust_daily_lesson::{CreateOrderError, CreateOrderUseCaseError, RepositoryError};

#[test]
fn converts_domain_error_to_usecase_error() {
    assert_eq!(
        CreateOrderUseCaseError::from(CreateOrderError::InvalidQuantity),
        CreateOrderUseCaseError::Domain(CreateOrderError::InvalidQuantity)
    );
    assert_eq!(RepositoryError::Conflict.to_string(), "repository conflict");
}
