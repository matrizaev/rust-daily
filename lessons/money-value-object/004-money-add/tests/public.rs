use rust_daily_lesson::{Currency, Money, MoneyAddError};

#[test]
fn adds_same_currency() {
    let first = Money::new(100, Currency::Usd);
    let second = Money::new(50, Currency::Usd);

    assert_eq!(
        first.checked_add(second),
        Ok(Money::new(150, Currency::Usd))
    );
}

#[test]
fn rejects_different_currencies() {
    let first = Money::new(100, Currency::Usd);
    let second = Money::new(50, Currency::Eur);

    assert_eq!(
        first.checked_add(second),
        Err(MoneyAddError::CurrencyMismatch {
            left: Currency::Usd,
            right: Currency::Eur,
        })
    );
}

#[test]
fn reports_amount_overflow() {
    let first = Money::new(u64::MAX, Currency::Gbp);
    let second = Money::new(1, Currency::Gbp);

    assert_eq!(
        first.checked_add(second),
        Err(MoneyAddError::AmountOverflow)
    );
}
