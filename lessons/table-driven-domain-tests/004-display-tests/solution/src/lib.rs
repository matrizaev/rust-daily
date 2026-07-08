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

impl std::fmt::Display for Percentage {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}%", self.0)
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
                Percentage::try_from(input).map(|value| value.value()),
                Ok(expected)
            );
        }
    }

    #[test]
    fn rejects_invalid_percentages() {
        let invalid_values = [101, 150, 1_000];

        for input in invalid_values {
            assert_eq!(
                Percentage::try_from(input),
                Err(PercentageError::OutOfRange)
            );
        }
    }

    #[test]
    fn formats_percentages() {
        let cases = [(0, "0%"), (50, "50%"), (100, "100%")];

        for (input, expected) in cases {
            assert_eq!(
                Percentage::try_from(input).map(|value| value.to_string()),
                Ok(expected.to_owned())
            );
        }
    }
}
