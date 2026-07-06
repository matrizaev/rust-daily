use std::fmt;

pub struct Secret(String);

impl Secret {
    pub fn new(value: impl Into<String>) -> Self { Self(value.into()) }
    pub fn expose(&self) -> &str { &self.0 }
}

// TODO: implement Display without revealing the inner value.
