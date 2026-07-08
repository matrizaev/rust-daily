use rust_daily_lesson::{LogEvent, LogFields, LogLevel, Secret};

#[test]
fn secret_display_is_redacted() {
    let secret = Secret::new("token-123");

    assert_eq!(secret.to_string(), "[redacted]");
    assert_eq!(secret.expose(), "token-123");
}

#[test]
fn previous_log_event_types_remain_available() {
    let event = LogEvent {
        event_name: "request.retry".to_owned(),
        level: LogLevel::Warn,
        fields: LogFields {
            request_id: "req-1".to_owned(),
            user_id: None,
            attempt: 2,
        },
    };

    assert_eq!(event.fields.request_id, "req-1");
}
