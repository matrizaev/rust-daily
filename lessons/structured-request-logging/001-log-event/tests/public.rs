use rust_daily_lesson::{LogEvent, LogLevel};

#[test]
fn event_has_name_and_level() {
    let event = LogEvent { event_name: "request.received".to_owned(), level: LogLevel::Info };

    assert_eq!(event.event_name, "request.received");
    assert_eq!(event.level, LogLevel::Info);
}
