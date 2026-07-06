use rust_daily_lesson::CreateOrderError;

#[test]
fn domain_errors_are_programmatic() {
    assert_eq!(CreateOrderError::EmptyOrder, CreateOrderError::EmptyOrder);
    assert_ne!(CreateOrderError::EmptyOrder, CreateOrderError::InvalidQuantity);
}
