use rust_daily_lesson::{Inventory, Item};

#[test]
fn inventory_consumes_into_items() {
    let inventory = Inventory::new(vec![
        Item { name: "Keyboard".to_owned() },
        Item { name: "Mouse".to_owned() },
    ]);
    let names: Vec<_> = inventory.into_iter().map(|item| item.name).collect();

    assert_eq!(names, vec!["Keyboard".to_owned(), "Mouse".to_owned()]);
}
