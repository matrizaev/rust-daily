use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn owned_iteration_moves_lines_out() {
    let lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);
    let skus: Vec<String> = lines.into_iter().map(|line| line.sku).collect();

    assert_eq!(skus, vec!["A".to_owned()]);
}
