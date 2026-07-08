use rust_daily_lesson::{OrderLine, OrderLines, OrderLinesError};

#[test]
fn validates_nonempty_lines() {
    assert_eq!(OrderLines::try_from(Vec::new()), Err(OrderLinesError::Empty));
    assert_eq!(
        OrderLines::try_from(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]).map(|lines| lines.len()),
        Ok(1)
    );
}

#[test]
fn drains_owned_lines() {
    let mut lines = OrderLines::try_from(vec![OrderLine { sku: "A".to_owned(), quantity: 2 }]).expect("line is present");
    let drained: Vec<OrderLine> = lines.drain().collect();

    assert_eq!(drained.len(), 1);
    assert!(lines.is_empty());
}
