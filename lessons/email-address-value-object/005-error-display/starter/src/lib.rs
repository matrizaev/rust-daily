#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

impl TryFrom<&str> for EmailAddress {
    type Error = EmailValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(EmailValidationError::Empty);
        }

        if !value.contains('@') {
            return Err(EmailValidationError::MissingAt);
        }

        Ok(Self {
            value: value.to_owned(),
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
}

impl std::fmt::Display for EmailAddress {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value)
    }
}

// Continue from the previous lesson.
// TODO: implement Display for EmailValidationError.
// TODO: implement std::error::Error for EmailValidationError.
