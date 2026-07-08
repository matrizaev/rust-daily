use std::error::Error;
use rust_daily_lesson::ConfigLoadError;

#[test]
fn file_read_preserves_io_source() {
    let error = ConfigLoadError::FileRead {
        source: std::io::Error::new(std::io::ErrorKind::NotFound, "missing config"),
    };

    assert_eq!(error.kind(), "file_read");
    assert!(error.source().is_some());
    assert_eq!(error.to_string(), "failed to read config file");
}
