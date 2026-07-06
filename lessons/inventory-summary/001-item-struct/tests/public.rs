use rust_daily_lesson::Item;

#[test]
fn item_names_inventory_fields() {
    let item = Item {
        sku: "SKU-1".to_owned(),
        name: "Keyboard".to_owned(),
        quantity: 10,
        reserved: 3,
    };

    assert_eq!(item.sku, "SKU-1");
    assert_eq!(item.name, "Keyboard");
    assert_eq!(item.quantity, 10);
    assert_eq!(item.reserved, 3);
}
