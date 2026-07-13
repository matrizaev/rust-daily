use rust_daily_lesson::priority_restock_notes;

#[test]
fn keeps_restock_alert_notes_in_normalized_order() {
    let notes = vec![
        "  URGENT restock batteries ".to_owned(),
        "".to_owned(),
        "general reminder".to_owned(),
        "low STOCK on cables".to_owned(),
    ];

    assert_eq!(
        priority_restock_notes(&notes),
        vec![
            "urgent restock batteries".to_owned(),
            "low stock on cables".to_owned(),
        ]
    );
}
