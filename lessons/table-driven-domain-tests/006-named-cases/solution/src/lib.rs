/// A bounded percentage value from 0 through 100.
///
/// ```
/// use rust_daily_lesson::Percentage;
///
/// assert_eq!(Percentage::try_from(75).map(|value| value.value()), Ok(75));
/// assert!(Percentage::try_from(101).is_err());
/// ```
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

    struct PercentageCase {
        name: &'static str,
        input: u16,
        expected: Result<u8, PercentageError>,
    }

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

    #[test]
    fn checks_named_percentage_cases() {
        let cases = [
            PercentageCase {
                name: "zero",
                input: 0,
                expected: Ok(0),
            },
            PercentageCase {
                name: "hundred",
                input: 100,
                expected: Ok(100),
            },
            PercentageCase {
                name: "too large",
                input: 101,
                expected: Err(PercentageError::OutOfRange),
            },
        ];

        for case in cases {
            let actual = Percentage::try_from(case.input).map(|value| value.value());
            assert_eq!(actual, case.expected, "case failed: {}", case.name);
        }
    }
}
