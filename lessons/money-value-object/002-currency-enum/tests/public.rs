use rust_daily_lesson::Currency;

#[test]
fn currency_variants() {
    assert_ne!(Currency::Usd, Currency::Eur);
    assert_ne!(Currency::Eur, Currency::Gbp);
}
