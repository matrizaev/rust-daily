#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(&self) -> u8 {
        self.0
    }
}

impl TryFrom<u16> for Percentage {
    type Error = PercentageError;

    fn try_from(value: u16) -> Result<Self, Self::Error> {
        if value > 100 {
            return Err(PercentageError::OutOfRange);
        }

        Ok(Self(value as u8))
    }
}


// TODO: add named table-driven cases for percentage boundaries.
