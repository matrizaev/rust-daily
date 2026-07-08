use rust_daily_lesson::{Percentage, PercentageError};

#[test]
fn public_examples_still_describe_key_cases() {
    let cases = [
        ("zero", 0, Ok(0)),
        ("maximum", 100, Ok(100)),
        ("too large", 101, Err(PercentageError::OutOfRange)),
    ];

    for (name, input, expected) in cases {
        assert_eq!(
            Percentage::try_from(input).map(Percentage::value),
            expected,
            "case failed: {name}"
        );
    }
}
