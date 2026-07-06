use std::fmt;

#[derive(Debug)]
pub enum ConfigLoadError {
    MissingEnvironment,
    InvalidPort,
    FileRead,
}

// TODO: implement Display for ConfigLoadError.
