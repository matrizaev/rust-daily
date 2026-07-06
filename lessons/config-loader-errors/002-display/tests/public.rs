use rust_daily_lesson::ConfigLoadError;

#[test]
fn formats_config_load_errors() {
    assert_eq!(ConfigLoadError::MissingEnvironment.to_string(), "missing environment");
    assert_eq!(ConfigLoadError::InvalidPort.to_string(), "invalid port");
    assert_eq!(ConfigLoadError::FileRead.to_string(), "could not read config file");
}
