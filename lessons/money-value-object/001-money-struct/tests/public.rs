use rust_daily_lesson::Money;

#[test]
fn money_is_public() {
    let _ = core::mem::size_of::<Money>();
}
