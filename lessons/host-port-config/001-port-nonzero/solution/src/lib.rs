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
