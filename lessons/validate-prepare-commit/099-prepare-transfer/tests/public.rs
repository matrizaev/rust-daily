use rust_daily_lesson::{
    AccountId, Ledger, Money, TransferCommand, TransferRejection, TransferRequest,
    TransferRequestError,
};

fn id(value: u32) -> AccountId {
    AccountId::new(value)
}

fn money(cents: u64) -> Money {
    Money::from_cents(cents)
}

fn two_account_ledger(source: u64, destination: u64) -> Ledger {
    Ledger::try_new([(id(1), money(source)), (id(2), money(destination))])
        .expect("fixture account IDs are unique")
}

fn command(source: u32, destination: u32, amount_cents: u64) -> TransferCommand {
    TransferCommand::try_from(TransferRequest::new(
        id(source),
        id(destination),
        amount_cents,
    ))
    .expect("fixture requests are valid")
}

#[test]
fn accepts_a_positive_transfer_between_distinct_accounts() {
    let request = TransferRequest::new(id(1), id(2), 250);

    let validated = TransferCommand::try_from(request).expect("a positive transfer is valid");

    assert_eq!(validated.source(), id(1));
    assert_eq!(validated.destination(), id(2));
    assert_eq!(validated.amount(), money(250));
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

#[test]
fn prepares_a_transfer_without_moving_money() {
    let ledger = two_account_ledger(500, 100);

    let prepared = ledger.prepare_transfer(command(1, 2, 250));

    assert!(prepared.is_ok(), "the transfer should be preparable");
    assert_eq!(ledger.balance(id(1)), Some(money(500)));
    assert_eq!(ledger.balance(id(2)), Some(money(100)));
}

#[test]
fn a_missing_source_is_rejected_without_touching_the_ledger() {
    let ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(9, 1, 250));

    assert_eq!(result, Err(TransferRejection::SourceNotFound));
    assert_eq!(ledger, before);
}

#[test]
fn a_missing_destination_is_rejected_without_touching_the_ledger() {
    let ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(1, 9, 250));

    assert_eq!(result, Err(TransferRejection::DestinationNotFound));
    assert_eq!(ledger, before);
}

#[test]
fn insufficient_funds_is_rejected_without_touching_the_ledger() {
    let ledger = two_account_ledger(100, 100);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(1, 2, 250));

    assert_eq!(result, Err(TransferRejection::InsufficientFunds));
    assert_eq!(ledger, before);
}

#[test]
fn destination_overflow_is_rejected_without_touching_the_ledger() {
    let ledger = two_account_ledger(500, u64::MAX);
    let before = ledger.clone();

    let result = ledger.prepare_transfer(command(1, 2, 250));

    assert_eq!(result, Err(TransferRejection::DestinationOverflow));
    assert_eq!(ledger, before);
}
