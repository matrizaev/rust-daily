use rust_daily_lesson::{LogEntry, LogView};

#[test]
fn view_borrows_slice_of_entries() {
    let entries = [LogEntry { level: "WARN", message: "slow" }];
    let view = LogView { entries: &entries };

    assert_eq!(view.entries.len(), 1);
    assert_eq!(view.entries[0].message, "slow");
}
