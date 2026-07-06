use rust_daily_lesson::{available_names, Item};

#[test]
fn collects_only_available_item_names() {
    let items = vec![
        Item { name: "Keyboard".to_owned(), quantity: 10, reserved: 2 },
        Item { name: "Mouse".to_owned(), quantity: 4, reserved: 4 },
    ];

    assert_eq!(available_names(&items), vec!["Keyboard"]);
}
