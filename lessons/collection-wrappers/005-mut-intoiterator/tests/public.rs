use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn mutable_iteration_updates_lines_in_place() {
    let mut lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);

    for line in &mut lines {
        line.quantity += 1;
    }

    let quantities: Vec<_> = (&mut lines).into_iter().map(|line| line.quantity).collect();
    assert_eq!(quantities, vec![3]);
}
