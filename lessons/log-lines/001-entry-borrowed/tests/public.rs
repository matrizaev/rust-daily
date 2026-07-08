use rust_daily_lesson::LogEntry;

#[test]
fn log_entry_borrows_text() {
    let entry = LogEntry {
        level: "INFO",
        message: "started",
    };

    assert_eq!(entry.level, "INFO");
    assert_eq!(entry.message, "started");
}
