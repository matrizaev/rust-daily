use rust_daily_lesson::Percentage;

#[test]
fn documented_usage_remains_valid() -> Result<(), rust_daily_lesson::PercentageError> {
    let percentage = Percentage::try_from(75)?;
    assert_eq!(percentage.value(), 75);
    Ok(())
}
