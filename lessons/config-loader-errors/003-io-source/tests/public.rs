use std::error::Error;
use std::io;

use rust_daily_lesson::ConfigLoadError;

#[test]
fn file_read_exposes_source_error() {
    let error = ConfigLoadError::FileRead(io::Error::new(io::ErrorKind::NotFound, "missing"));

    assert!(error.source().is_some());
}

#[test]
fn keeps_existing_display_messages() {
    let error = ConfigLoadError::FileRead(io::Error::new(io::ErrorKind::NotFound, "missing"));

    assert_eq!(
        ConfigLoadError::MissingEnvironment.to_string(),
        "missing environment"
    );
    assert_eq!(ConfigLoadError::InvalidPort.to_string(), "invalid port");
    assert_eq!(error.to_string(), "could not read config file");
}
