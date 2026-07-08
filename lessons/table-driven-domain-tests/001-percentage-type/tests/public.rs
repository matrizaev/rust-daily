use rust_daily_lesson::{Percentage, PercentageError};

#[test]
fn enforces_percentage_bounds() {
    assert_eq!(Percentage::try_from(100).map(Percentage::value), Ok(100));
    assert_eq!(Percentage::try_from(101), Err(PercentageError::OutOfRange));
}
