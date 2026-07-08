use rust_daily_lesson::{OrderLine, OrderLines};

#[test]
fn iter_yields_borrowed_lines() {
    let lines = OrderLines::new(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]);
    let skus: Vec<&str> = lines.iter().map(|line| line.sku.as_str()).collect();

    assert_eq!(skus, vec!["A"]);
    assert_eq!(lines.len(), 1);
}
