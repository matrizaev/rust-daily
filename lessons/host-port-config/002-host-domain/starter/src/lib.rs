use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(value: u16) -> Option<Self> {
        NonZeroU16::new(value).map(Self)
    }

    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

// Continue from the previous lesson.
// TODO: Define HostValidationError with Empty and InvalidCharacters.
// TODO: Add a validate_host(&str) helper for the shared rules.
// TODO: Define Host as a public tuple struct with a private String field.
// TODO: Expose as_str(&self) -> &str.
// TODO: Implement TryFrom<&str> for Host.
