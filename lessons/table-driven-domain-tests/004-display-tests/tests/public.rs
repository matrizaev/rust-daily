use rust_daily_lesson::Percentage;

#[test]
fn display_formats_percent_sign() {
    assert_eq!(Percentage::try_from(42).map(|value| value.to_string()), Ok("42%".to_owned()));
}
