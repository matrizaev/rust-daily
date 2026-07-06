use std::fmt;
use std::num::NonZeroU16;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Port(NonZeroU16);

impl Port {
    pub fn new(val: u16) -> Option<Self> {
        NonZeroU16::new(val).map(Self)
    }
    pub fn value(&self) -> u16 {
        self.0.get()
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host {
    pub fn new_unchecked(val: String) -> Self {
        Self(val)
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Endpoint {
    pub host: Host,
    pub port: Port,
}

// TODO: Implement std::fmt::Display for Endpoint.
