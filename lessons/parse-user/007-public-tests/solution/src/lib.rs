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
