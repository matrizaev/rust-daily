use rust_daily_lesson::{Percentage, PercentageError};

#[test]
fn public_invalid_cases_match() {
    for input in [101, 500, u16::MAX] {
        assert_eq!(Percentage::try_from(input), Err(PercentageError::OutOfRange));
    }
}
