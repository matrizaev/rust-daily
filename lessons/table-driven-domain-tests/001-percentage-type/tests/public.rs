use rust_daily_lesson::{Percentage, PercentageError};

#[test]
fn percentage_accepts_values_from_zero_to_hundred() {
    assert_eq!(Percentage::try_from(0).map(|value| value.value()), Ok(0));
    assert_eq!(Percentage::try_from(100).map(|value| value.value()), Ok(100));
}

#[test]
fn percentage_rejects_out_of_range_values() {
    assert_eq!(Percentage::try_from(101), Err(PercentageError::OutOfRange));
}
