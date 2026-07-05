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
    MissingDomain,
}

impl TryFrom<&str> for EmailAddress {
    type Error = EmailValidationError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(EmailValidationError::Empty);
        }

        let (_local, domain) = value
            .split_once('@')
            .ok_or(EmailValidationError::MissingAt)?;

        if domain.is_empty() {
            return Err(EmailValidationError::MissingDomain);
        }

        Ok(Self {
            value: value.to_owned(),
        })
    }
}

// TODO: implement std::str::FromStr for EmailAddress.
