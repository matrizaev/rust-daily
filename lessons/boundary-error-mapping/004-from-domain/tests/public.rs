use rust_daily_lesson::{CreateOrderError, CreateOrderUseCaseError};

#[test]
fn converts_domain_error_to_usecase_error() {
    assert_eq!(
        CreateOrderUseCaseError::from(CreateOrderError::InvalidQuantity),
        CreateOrderUseCaseError::Domain(CreateOrderError::InvalidQuantity)
    );
}
