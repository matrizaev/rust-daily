#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EmailAddress {
    value: String,
}

impl EmailAddress {
    pub fn new_unchecked(value: impl Into<String>) -> Self {
        Self {
            value: value.into(),
        }
    }
}

// TODO: implement std::fmt::Display for EmailAddress.
