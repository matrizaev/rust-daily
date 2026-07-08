use rust_daily_lesson::ConfigLoadError;

#[test]
fn variants_have_human_readable_messages() {
    assert_eq!(ConfigLoadError::MissingEnvironment.to_string(), "missing APP_PORT");
    assert_eq!(ConfigLoadError::InvalidPort.to_string(), "invalid APP_PORT");
    assert_eq!(ConfigLoadError::FileRead.to_string(), "failed to read config file");
}
