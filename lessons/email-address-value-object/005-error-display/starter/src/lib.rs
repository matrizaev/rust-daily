#[derive(Debug, Clone, PartialEq, Eq)]
pub enum EmailValidationError {
    Empty,
    MissingAt,
    MissingDomain,
}

// TODO: implement Display for EmailValidationError.

// TODO: implement std::error::Error for EmailValidationError.
