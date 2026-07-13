use rust_daily_lesson::{alert_priority, LogLevel};

#[test]
fn maps_log_levels_to_alert_priority() {
    assert_eq!(alert_priority(LogLevel::Info), 0);
    assert_eq!(alert_priority(LogLevel::Warn), 1);
    assert_eq!(alert_priority(LogLevel::Error), 2);
}
