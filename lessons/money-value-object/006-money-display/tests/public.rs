use rust_daily_lesson::{Money, Currency};

#[test]
fn formats_correctly() {
    assert_eq!(Money::new(1999, Currency::Usd).to_string(), "$19.99");
    assert_eq!(Money::new(500, Currency::Eur).to_string(), "€5.00");
    assert_eq!(Money::new(5, Currency::Usd).to_string(), "$0.05");
}
