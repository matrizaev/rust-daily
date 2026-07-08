use rust_daily_lesson::{OrderLine, OrderLines, OrderLinesError};

#[test]
fn validates_nonempty_lines() {
    assert_eq!(
        OrderLines::try_from(Vec::new()),
        Err(OrderLinesError::Empty)
    );
    assert_eq!(
        OrderLines::try_from(vec![OrderLine {
            sku: "A".to_owned(),
            quantity: 1
        }])
        .map(|lines| lines.len()),
        Ok(1)
    );
}
