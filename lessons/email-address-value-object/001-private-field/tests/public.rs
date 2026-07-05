use rust_daily_lesson::EmailAddress;

#[test]
fn email_address_is_a_public_domain_type() {
    let _ = core::mem::size_of::<EmailAddress>();
}
