use std::num::ParseIntError;

#[derive(Debug)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId(ParseIntError),
}

// TODO: implement From<ParseIntError> for ParseUserError.

pub fn parse_id(id_text: &str) -> Result<u64, ParseUserError> {
    id_text.parse::<u64>().map_err(ParseUserError::from)
}
