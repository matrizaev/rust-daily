use std::error::Error;
use std::fmt;

use std::num::ParseIntError;

#[derive(Debug)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId(ParseIntError),
}

impl From<ParseIntError> for ParseUserError {
    fn from(error: ParseIntError) -> Self {
        ParseUserError::InvalidId(error)
    }
}

pub fn parse_id(id_text: &str) -> Result<u64, ParseUserError> {
    id_text.parse::<u64>().map_err(ParseUserError::from)
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


impl Error for ParseUserError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            ParseUserError::InvalidId(error) => Some(error),
            ParseUserError::MissingId | ParseUserError::MissingName | ParseUserError::MissingEmail => None,
        }
    }
}
