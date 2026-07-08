use rust_daily_lesson::{CreateOrderError, CreateOrderUseCaseError, RepositoryError};

#[test]
fn converts_domain_and_repository_errors() {
    assert_eq!(
        CreateOrderUseCaseError::from(CreateOrderError::EmptyOrder),
        CreateOrderUseCaseError::Domain(CreateOrderError::EmptyOrder)
    );
    assert_eq!(
        CreateOrderUseCaseError::from(RepositoryError::Conflict),
        CreateOrderUseCaseError::Repository(RepositoryError::Conflict)
    );
}
