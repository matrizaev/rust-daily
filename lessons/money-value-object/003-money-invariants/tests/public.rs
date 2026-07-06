use rust_daily_lesson::{Currency, Money};

#[test]
fn money_constructor_and_accessors() {
    let money = Money::new(100, Currency::Gbp);

    assert_eq!(money.amount(), 100);
    assert_eq!(money.currency(), Currency::Gbp);
}
