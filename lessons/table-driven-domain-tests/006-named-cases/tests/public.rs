use rust_daily_lesson::{Percentage, PercentageError};

#[test]
fn percentage_boundaries_are_documented() {
    assert_eq!(Percentage::try_from(0).map(|value| value.value()), Ok(0));
    assert_eq!(Percentage::try_from(100).map(|value| value.value()), Ok(100));
    assert_eq!(Percentage::try_from(101), Err(PercentageError::OutOfRange));
}
