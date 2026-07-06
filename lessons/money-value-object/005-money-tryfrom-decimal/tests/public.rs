use rust_daily_lesson::{Money, Currency, MoneyParseError};

#[test]
fn parses_valid_decimals() {
    assert_eq!(Money::try_from("19.99"), Ok(Money::new(1999, Currency::Usd)));
    assert_eq!(Money::try_from("5"), Ok(Money::new(500, Currency::Usd)));
    assert_eq!(Money::try_from("5.2"), Ok(Money::new(520, Currency::Usd)));
}

#[test]
fn rejects_invalid_decimals() {
    assert_eq!(Money::try_from("abc"), Err(MoneyParseError::InvalidFormat));
    assert_eq!(Money::try_from("12.345"), Err(MoneyParseError::InvalidFormat));
    assert_eq!(Money::try_from("12.3.4"), Err(MoneyParseError::InvalidFormat));
}
