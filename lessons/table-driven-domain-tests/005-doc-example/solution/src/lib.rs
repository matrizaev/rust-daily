/// A bounded percentage from 0 through 100.
///
/// ```
/// use rust_daily_lesson::Percentage;
///
/// let percentage = Percentage::try_from(75)?;
/// assert_eq!(percentage.value(), 75);
/// # Ok::<(), rust_daily_lesson::PercentageError>(())
/// ```
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

impl std::fmt::Display for Percentage {
    fn fmt(&self, formatter: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(formatter, "{}%", self.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_valid_percentages() {
        for (input, expected) in [(0, 0), (50, 50), (100, 100)] {
            assert_eq!(Percentage::try_from(input).map(Percentage::value), Ok(expected));
        }
    }

    #[test]
    fn rejects_invalid_percentages() {
        for input in [101, 150, 1_000] {
            assert_eq!(Percentage::try_from(input), Err(PercentageError::OutOfRange));
        }
    }

    #[test]
    fn formats_percentages() {
        for (input, expected) in [(0, "0%"), (50, "50%"), (100, "100%")] {
            let percentage = Percentage::try_from(input).expect("case is in range");
            assert_eq!(percentage.to_string(), expected);
        }
    }
}
