use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn mutable_iteration_updates_lines_in_place() {
    let mut lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);

    for line in &mut lines {
        line.quantity += 3;
    }

    assert_eq!(lines.as_slice()[0].quantity, 5);
}
