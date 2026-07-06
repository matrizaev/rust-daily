use rust_daily_lesson::{alert_messages, LogEntry, LogLevel};

#[test]
fn alert_filter_keeps_only_warnings_and_errors() {
    let entries = [
        LogEntry { level: LogLevel::Info, message: "started" },
        LogEntry { level: LogLevel::Warn, message: "slow response" },
        LogEntry { level: LogLevel::Error, message: "write failed" },
    ];

    assert_eq!(
        alert_messages(&entries),
        vec!["slow response", "write failed"]
    );
}
