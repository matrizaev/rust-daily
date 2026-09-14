use rust_daily_lesson::{AccountId, Money, TransferCommand, TransferRequest, TransferRequestError};

fn id(value: u32) -> AccountId {
    AccountId::new(value)
}

fn money(cents: u64) -> Money {
    Money::from_cents(cents)
}

#[test]
fn accepts_a_positive_transfer_between_distinct_accounts() {
    let request = TransferRequest::new(id(1), id(2), 250);

    let command = TransferCommand::try_from(request).expect("a positive transfer is valid");

    assert_eq!(command.source(), id(1));
    assert_eq!(command.destination(), id(2));
    assert_eq!(command.amount(), money(250));
}

#[test]
fn rejects_a_zero_amount() {
    let request = TransferRequest::new(id(1), id(2), 0);

    assert_eq!(
        TransferCommand::try_from(request),
        Err(TransferRequestError::ZeroAmount)
    );
}

#[test]
fn rejects_a_transfer_to_the_same_account() {
    let request = TransferRequest::new(id(7), id(7), 500);

    assert_eq!(
        TransferCommand::try_from(request),
        Err(TransferRequestError::SameAccount)
    );
}
