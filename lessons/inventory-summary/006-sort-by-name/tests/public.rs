use rust_daily_lesson::{sort_by_name, Item};

#[test]
fn sorts_items_by_name() {
    let mut items = vec![
        Item { name: "Mouse".to_owned(), quantity: 4 },
        Item { name: "Keyboard".to_owned(), quantity: 10 },
    ];

    sort_by_name(&mut items);

    assert_eq!(items[0].name, "Keyboard");
    assert_eq!(items[1].name, "Mouse");
}
