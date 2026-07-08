use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn iter_borrows_lines() {
    let lines = OrderLines::new(vec![OrderLine {
        sku: "A".to_owned(),
        quantity: 2,
    }]);
    let skus: Vec<_> = lines.iter().map(|line| line.sku.as_str()).collect();

    assert_eq!(skus, vec!["A"]);
}
