use rust_daily_lesson::{alert_messages, AlertEntry, LogLevel, LogMessage};

fn entry(level: LogLevel, message: &'static str) -> AlertEntry<'static> {
    AlertEntry {
        level,
        message: LogMessage {
            text: message.into(),
        },
    }
}

#[test]
fn alert_filter_keeps_only_warnings_and_errors() {
    let entries = [
        entry(LogLevel::Info, "started"),
        entry(LogLevel::Warn, "slow response"),
        entry(LogLevel::Error, "write failed"),
    ];

    assert_eq!(
        alert_messages(&entries),
        vec!["slow response", "write failed"]
    );
}
