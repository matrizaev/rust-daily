use rust_daily_lesson::Percentage;

#[test]
fn public_behavior_still_accepts_boundaries() {
    assert_eq!(Percentage::try_from(0).map(|value| value.value()), Ok(0));
    assert_eq!(Percentage::try_from(100).map(|value| value.value()), Ok(100));
}
