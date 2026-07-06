use rust_daily_lesson::{Money, Currency};

#[test]
fn adds_same_currency() {
    let m1 = Money::new(100, Currency::Usd);
    let m2 = Money::new(50, Currency::Usd);
    let res = m1 + m2;
    assert_eq!(res.amount(), 150);
}

#[test]
#[should_panic]
fn panics_different_currencies() {
    let m1 = Money::new(100, Currency::Usd);
    let m2 = Money::new(50, Currency::Eur);
    let _ = m1 + m2;
}
