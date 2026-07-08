use rust_daily_lesson::Percentage;

#[test]
fn public_valid_cases_match() {
    for (input, expected) in [(0, 0), (25, 25), (100, 100)] {
        assert_eq!(Percentage::try_from(input).map(Percentage::value), Ok(expected));
    }
}
