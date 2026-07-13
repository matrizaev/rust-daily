use rust_daily_lesson::Currency;

#[test]
fn currency_variants() {
    assert_ne!(Currency::Usd, Currency::Eur);
    assert_ne!(Currency::Eur, Currency::Gbp);
}

#[test]
fn currency_codes_are_stable_iso_values() {
    assert_eq!(Currency::Usd.code(), "USD");
    assert_eq!(Currency::Eur.code(), "EUR");
    assert_eq!(Currency::Gbp.code(), "GBP");
}
