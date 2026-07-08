#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Percentage(u8);

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PercentageError {
    OutOfRange,
}

impl Percentage {
    pub fn value(self) -> u8 {
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_valid_percentages() {
        let cases = [(0, 0), (50, 50), (100, 100)];

        for (input, expected) in cases {
            assert_eq!(
                Percentage::try_from(input).map(Percentage::value),
                Ok(expected)
            );
        }
    }
}

// TODO: add invalid values above the upper bound.
