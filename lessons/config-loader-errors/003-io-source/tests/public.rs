use std::error::Error;
use std::io;

use rust_daily_lesson::ConfigLoadError;

#[test]
fn file_read_exposes_source_error() {
    let error = ConfigLoadError::FileRead(io::Error::new(io::ErrorKind::NotFound, "missing"));

    assert!(error.source().is_some());
}
