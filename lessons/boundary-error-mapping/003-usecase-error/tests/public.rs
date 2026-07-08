use rust_daily_lesson::{CreateOrderError, CreateOrderUseCaseError, RepositoryError};

#[test]
fn usecase_error_keeps_error_family() {
    assert_eq!(
        CreateOrderUseCaseError::Domain(CreateOrderError::EmptyOrder),
        CreateOrderUseCaseError::Domain(CreateOrderError::EmptyOrder)
    );
    assert_eq!(
        CreateOrderUseCaseError::Repository(RepositoryError::Conflict),
        CreateOrderUseCaseError::Repository(RepositoryError::Conflict)
    );
    assert_eq!(
        RepositoryError::Unavailable.to_string(),
        "repository unavailable"
    );
}
