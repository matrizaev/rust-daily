use rust_daily_lesson::ConfigLoadError;

#[test]
fn error_type_is_public() {
    let _ = ConfigLoadError::MissingEnvironment;
    let _ = ConfigLoadError::InvalidPort;
    let _ = ConfigLoadError::FileRead;
}
