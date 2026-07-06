use rust_daily_lesson::{total_quantity, Item};

#[test]
fn folds_quantities_into_total() {
    let items = vec![Item { quantity: 2 }, Item { quantity: 5 }];

    assert_eq!(total_quantity(&items), 7);
    assert_eq!(total_quantity(&[]), 0);
}
