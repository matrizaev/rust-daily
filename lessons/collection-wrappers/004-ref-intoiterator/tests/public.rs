use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn borrowed_iteration_keeps_wrapper_available() {
    let lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);
    let total: u32 = (&lines).into_iter().map(|line| line.quantity).sum();
    let skus: Vec<_> = (&lines).into_iter().map(|line| line.sku.as_str()).collect();

    assert_eq!(total, 2);
    assert_eq!(skus, vec!["A"]);
}
