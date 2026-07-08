use rust_daily_lesson::{LogEvent, LogFields, LogLevel};

#[test]
fn event_carries_structured_fields() {
    let event = LogEvent {
        event_name: "request.retry".to_owned(),
        level: LogLevel::Warn,
        fields: LogFields {
            request_id: "req-1".to_owned(),
            user_id: Some("user-1".to_owned()),
            attempt: 2,
        },
    };

    assert_eq!(event.fields.request_id, "req-1");
    assert_eq!(event.fields.attempt, 2);
}
