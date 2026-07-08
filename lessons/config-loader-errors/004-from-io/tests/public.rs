use std::io;

use rust_daily_lesson::ConfigLoadError;

#[test]
fn converts_io_error_into_config_error() {
    let converted = ConfigLoadError::from(io::Error::new(io::ErrorKind::NotFound, "missing"));

    assert!(matches!(converted, ConfigLoadError::FileRead(_)));
}

#[test]
fn converted_io_error_keeps_display_message() {
    let converted = ConfigLoadError::from(io::Error::new(io::ErrorKind::NotFound, "missing"));

    assert_eq!(converted.to_string(), "could not read config file");
}
