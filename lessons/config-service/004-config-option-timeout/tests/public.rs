use rust_daily_lesson::Config;

#[test]
fn timeout_is_explicitly_optional() {
    let default_config = Config::default();
    let configured = Config {
        timeout_seconds: Some(30),
        ..Config::default()
    };

    assert_eq!(default_config.timeout_seconds, None);
    assert_eq!(configured.timeout_seconds, Some(30));
}
