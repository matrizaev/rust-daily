use std::borrow::Cow;

use rust_daily_lesson::LogMessage;

#[test]
fn log_message_can_borrow_or_own_text() {
    let borrowed = LogMessage {
        text: Cow::Borrowed("started"),
    };
    let owned = LogMessage {
        text: Cow::Owned("normalized".to_owned()),
    };

    assert_eq!(borrowed.text, "started");
    assert_eq!(owned.text, "normalized");
}
