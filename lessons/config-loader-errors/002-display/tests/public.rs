use rust_daily_lesson::ConfigLoadError;

#[test]
fn exposes_stable_error_kinds() {
    assert_eq!(ConfigLoadError::MissingEnvironment.kind(), "missing_environment");
    assert_eq!(ConfigLoadError::InvalidPort.kind(), "invalid_port");
    assert_eq!(ConfigLoadError::FileRead.kind(), "file_read");
}
