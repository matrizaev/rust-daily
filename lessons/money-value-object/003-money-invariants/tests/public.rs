use rust_daily_lesson::{Money, Currency};

#[test]
fn money_constructor_and_accessors() {
    let m = Money::new(100, Currency::Usd);
    assert_eq!(m.amount(), 100);
    assert_eq!(m.currency(), Currency::Usd);
}
