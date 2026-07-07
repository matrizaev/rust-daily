use std::fmt;

use std::num::ParseIntError;

#[derive(Debug)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId(ParseIntError),
}

pub fn parse_id(id_text: &str) -> Result<u64, ParseUserError> {
    id_text.parse::<u64>().map_err(ParseUserError::InvalidId)
}


impl std::fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId(_) => write!(f, "invalid id"),
        }
    }
}


impl std::error::Error for ParseUserError {}

// Continue from the previous lesson.
// TODO: implement From<ParseIntError> for ParseUserError.
