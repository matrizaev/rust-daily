use rust_daily_lesson::Percentage;

#[test]
fn documented_percentage_behavior_works() {
    assert_eq!(Percentage::try_from(75).map(|value| value.value()), Ok(75));
    assert!(Percentage::try_from(101).is_err());
}
