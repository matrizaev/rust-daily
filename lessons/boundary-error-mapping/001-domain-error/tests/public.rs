use rust_daily_lesson::CreateOrderError;

#[test]
fn domain_errors_are_specific_and_readable() {
    assert_eq!(CreateOrderError::EmptyOrder.to_string(), "order must contain at least one line");
    assert_eq!(CreateOrderError::InvalidQuantity.to_string(), "order line quantity must be positive");
}
