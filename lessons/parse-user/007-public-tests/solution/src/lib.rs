use std::convert::TryFrom;
use std::error::Error;
use std::fmt;
use std::num::ParseIntError;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub name: String,
    pub email: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
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

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text.parse::<u64>()?;
    let name = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingName)?;
    let email = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingEmail)?;

    Ok(User {
        id,
        name: name.to_owned(),
        email: email.to_owned(),
    })
}

impl TryFrom<&str> for User {
    type Error = ParseUserError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        parse_user(value)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_valid_user() {
        assert_eq!(
            parse_user("42,Ada,ada@example.com"),
            Ok(User {
                id: 42,
                name: "Ada".to_owned(),
                email: "ada@example.com".to_owned(),
            })
        );
    }

    #[test]
    fn rejects_missing_email() {
        assert!(matches!(
            parse_user("42,Ada"),
            Err(ParseUserError::MissingEmail)
        ));
    }
}

impl fmt::Display for ParseUserError {
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
            ParseUserError::MissingId
            | ParseUserError::MissingName
            | ParseUserError::MissingEmail => None,
        }
    }
}
