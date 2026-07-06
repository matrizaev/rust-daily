use std::num::ParseIntError;

#[derive(Debug)]
pub enum ConfigLoadError {
    InvalidPort(ParseIntError),
}

// TODO: implement From<ParseIntError> and parse_port.
