use rust_daily_lesson::reorder_notes;

#[test]
fn keeps_inventory_notes_in_normalized_order() {
    let notes = vec![
        "  URGENT restock batteries ".to_owned(),
        "".to_owned(),
        "general reminder".to_owned(),
        "low STOCK on cables".to_owned(),
    ];

    assert_eq!(
        reorder_notes(&notes),
        vec![
            "urgent restock batteries".to_owned(),
            "low stock on cables".to_owned(),
        ]
    );
}
