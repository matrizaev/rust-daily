use std::io;

use rust_daily_lesson::ConfigLoadError;

#[test]
fn converts_io_error_into_config_error() {
    let converted = ConfigLoadError::from(io::Error::new(io::ErrorKind::NotFound, "missing"));

    assert!(matches!(converted, ConfigLoadError::FileRead(_)));
}
