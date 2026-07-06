use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId,
}

// TODO: implement std::fmt::Display for ParseUserError.
