use std::io;

#[derive(Debug)]
pub enum ConfigLoadError {
    FileRead(io::Error),
}

impl From<io::Error> for ConfigLoadError {
    fn from(error: io::Error) -> Self {
        ConfigLoadError::FileRead(error)
    }
}
