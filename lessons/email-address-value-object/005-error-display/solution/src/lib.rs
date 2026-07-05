#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
    MissingDomain,
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
