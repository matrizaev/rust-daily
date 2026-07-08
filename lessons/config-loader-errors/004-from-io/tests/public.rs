use std::error::Error;
use rust_daily_lesson::ConfigLoadError;

#[test]
fn converts_io_error_and_keeps_source() {
    let error = ConfigLoadError::from(std::io::Error::new(
        std::io::ErrorKind::PermissionDenied,
        "denied",
    ));

    assert_eq!(error.kind(), "file_read");
    assert!(error.source().is_some());
}
