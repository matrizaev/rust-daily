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
    use proptest::prelude::*;

    macro_rules! percentage_cases {
        ($test_name:ident, { $($name:ident: $input:expr => $expected:expr),+ $(,)? }) => {
            #[test]
            fn $test_name() {
                let cases = [$( (stringify!($name), $input, $expected), )+];

                for (name, input, expected) in cases {
                    let actual = Percentage::try_from(input).map(Percentage::value);
                    assert_eq!(actual, expected, "case failed: {name}");
                }
            }
        };
    }

    percentage_cases!(named_examples, {
        zero: 0 => Ok(0),
        middle: 50 => Ok(50),
        maximum: 100 => Ok(100),
        too_large: 101 => Err(PercentageError::OutOfRange),
    });

    proptest! {
        #[test]
        fn accepts_every_value_in_range(input in 0u16..=100) {
            let percentage = Percentage::try_from(input).expect("generated value is in range");
            prop_assert_eq!(percentage.value(), input as u8);
        }

        #[test]
        fn rejects_every_value_above_range(input in 101u16..=u16::MAX) {
            prop_assert_eq!(
                Percentage::try_from(input),
                Err(PercentageError::OutOfRange)
            );
        }
    }
}
