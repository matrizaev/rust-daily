use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn exposes_lines_as_slice_without_moving_vec() {
    let lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);

    assert_eq!(lines.len(), 1);
    assert!(!lines.is_empty());
    assert_eq!(lines.as_slice()[0].sku, "A");
}
