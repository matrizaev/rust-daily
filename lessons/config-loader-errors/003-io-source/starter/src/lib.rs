use std::error::Error;
use std::fmt;
use std::io;

#[derive(Debug)]
pub enum ConfigLoadError {
    MissingEnvironment,
    InvalidPort,
    FileRead(io::Error),
}

impl fmt::Display for ConfigLoadError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "config load failed")
    }
}

// TODO: implement Error and return the I/O source for FileRead.
