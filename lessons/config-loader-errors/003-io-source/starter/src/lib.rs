use std::fmt;

#[derive(Debug)]
pub enum ConfigLoadError {
    MissingEnvironment,
    InvalidPort,
    FileRead,
}

impl fmt::Display for ConfigLoadError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ConfigLoadError::MissingEnvironment => write!(f, "missing environment"),
            ConfigLoadError::InvalidPort => write!(f, "invalid port"),
            ConfigLoadError::FileRead => write!(f, "could not read config file"),
        }
    }
}

// Continue from the previous lesson.
// TODO: implement Error and return the I/O source for FileRead.
