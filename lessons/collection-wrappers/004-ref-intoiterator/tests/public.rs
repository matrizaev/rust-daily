use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn borrowed_wrapper_iterates_without_consuming() {
    let lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);
    let mut total = 0;

    for line in &lines {
        total += line.quantity;
    }

    assert_eq!(total, 2);
    assert_eq!(lines.len(), 1);
}
