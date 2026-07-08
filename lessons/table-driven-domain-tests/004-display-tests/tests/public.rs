use rust_daily_lesson::Percentage;

#[test]
fn public_display_cases_match() {
    for (input, expected) in [(0, "0%"), (75, "75%"), (100, "100%")] {
        let percentage = Percentage::try_from(input).expect("case is valid");
        assert_eq!(percentage.to_string(), expected);
    }
}
