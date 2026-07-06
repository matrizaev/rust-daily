use std::io;

#[derive(Debug)]
pub enum ConfigLoadError {
    FileRead(io::Error),
}

// TODO: implement From<io::Error> for ConfigLoadError.
