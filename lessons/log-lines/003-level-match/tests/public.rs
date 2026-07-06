use rust_daily_lesson::{severity, LogLevel};

#[test]
fn maps_log_levels_to_severity() {
    assert_eq!(severity(LogLevel::Info), 1);
    assert_eq!(severity(LogLevel::Warn), 2);
    assert_eq!(severity(LogLevel::Error), 3);
}
