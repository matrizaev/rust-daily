use rust_daily_lesson::{Inventory, Item};

#[test]
fn inventory_consumes_into_items() {
    let inventory = Inventory::new(vec![
        Item { sku: "keyboard".to_owned(), name: "Keyboard".to_owned(), quantity: 10, reserved: 0 },
        Item { sku: "mouse".to_owned(), name: "Mouse".to_owned(), quantity: 4, reserved: 0 },
    ]);
    let names: Vec<_> = inventory.into_iter().map(|item| item.name).collect();

    assert_eq!(names, vec!["Keyboard".to_owned(), "Mouse".to_owned()]);
}
