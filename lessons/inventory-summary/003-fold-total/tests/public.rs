use rust_daily_lesson::{total_quantity, Item};

#[test]
fn folds_quantities_into_total() {
    let items = vec![
        Item {
            sku: "a".to_owned(),
            name: "A".to_owned(),
            quantity: 2,
            reserved: 0,
        },
        Item {
            sku: "b".to_owned(),
            name: "B".to_owned(),
            quantity: 5,
            reserved: 0,
        },
    ];

    assert_eq!(total_quantity(&items), 7);
    assert_eq!(total_quantity(&[]), 0);
}
