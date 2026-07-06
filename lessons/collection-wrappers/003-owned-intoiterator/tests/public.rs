use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn consuming_iteration_moves_lines_out() {
    let lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);
    let moved: Vec<_> = lines.into_iter().map(|line| line.sku).collect();

    assert_eq!(moved, vec!["A".to_owned()]);
}
