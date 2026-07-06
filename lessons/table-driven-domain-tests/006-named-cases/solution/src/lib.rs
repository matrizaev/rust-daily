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


#[cfg(test)]
mod tests {
    use super::*;

    struct PercentageCase {
        name: &'static str,
        input: u16,
        expected: Result<u8, PercentageError>,
    }

    #[test]
    fn checks_named_percentage_cases() {
        let cases = [
            PercentageCase { name: "zero", input: 0, expected: Ok(0) },
            PercentageCase { name: "hundred", input: 100, expected: Ok(100) },
            PercentageCase { name: "too large", input: 101, expected: Err(PercentageError::OutOfRange) },
        ];

        for case in cases {
            let actual = Percentage::try_from(case.input).map(|value| value.value());
            assert_eq!(actual, case.expected, "case failed: {}", case.name);
        }
    }
}
