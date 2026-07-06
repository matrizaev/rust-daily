use rust_daily_lesson::{Percentage, PercentageError};

#[test]
fn public_behavior_rejects_out_of_range_values() {
    assert_eq!(Percentage::try_from(101), Err(PercentageError::OutOfRange));
    assert_eq!(Percentage::try_from(1_000), Err(PercentageError::OutOfRange));
}
