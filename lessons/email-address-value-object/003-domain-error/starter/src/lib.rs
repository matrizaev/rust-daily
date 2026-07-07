#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

impl EmailAddress {
    pub fn as_str(&self) -> &str {
        &self.value
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
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

// Continue from the previous lesson.
// TODO: complete this lesson's next change.
