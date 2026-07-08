use std::fmt;

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
    InvalidId,
}

pub fn parse_user(input: &str) -> Result<User, ParseUserError> {
    let mut parts = input.split(',');

    let id_text = parts
        .next()
        .filter(|value| !value.is_empty())
        .ok_or(ParseUserError::MissingId)?;
    let id = id_text
        .parse::<u64>()
        .map_err(|_| ParseUserError::InvalidId)?;
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

impl fmt::Display for ParseUserError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ParseUserError::MissingId => write!(f, "missing id"),
            ParseUserError::MissingName => write!(f, "missing name"),
            ParseUserError::MissingEmail => write!(f, "missing email"),
            ParseUserError::InvalidId => write!(f, "invalid id"),
        }
    }
}

// Continue from the previous lesson.
// TODO: implement std::error::Error for ParseUserError.
