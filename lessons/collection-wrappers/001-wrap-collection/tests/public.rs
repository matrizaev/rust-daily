use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn wrapper_owns_order_lines() {
    let lines = OrderLines::new(vec![OrderLine {
        sku: "A".to_owned(),
        quantity: 2,
    }]);

    assert_eq!(lines.len(), 1);
    assert!(!lines.is_empty());
}
