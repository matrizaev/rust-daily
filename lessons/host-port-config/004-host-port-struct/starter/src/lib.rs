use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(val: u16) -> Option<Self> {
        NonZeroU16::new(val).map(Self)
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn new_unchecked(val: String) -> Self {
        Self(val)
    }
}

// TODO: Define Endpoint struct and constructor.
