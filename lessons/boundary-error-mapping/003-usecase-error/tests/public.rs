use std::error::Error;
use rust_daily_lesson::{CreateOrderError, CreateOrderUseCaseError};

#[test]
fn usecase_error_preserves_domain_source() {
    let error = CreateOrderUseCaseError::Domain(CreateOrderError::EmptyOrder);

    assert_eq!(error.to_string(), "domain error: order must contain at least one line");
    assert!(error.source().is_some());
}
