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

impl std::fmt::Display for EmailAddress {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.value)
    }
}

impl std::fmt::Display for EmailValidationError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Empty => write!(f, "email address is empty"),
            Self::MissingAt => write!(f, "email address is missing @"),
            Self::MissingDomain => write!(f, "email address is missing a domain"),
        }
    }
}

impl std::error::Error for EmailValidationError {}

impl std::str::FromStr for EmailAddress {
    type Err = EmailValidationError;

    fn from_str(value: &str) -> Result<Self, Self::Err> {
        Self::try_from(value)
    }
}
