use rust_daily_lesson::{
    execute_transfer, AccountId, Ledger, Money, PreparedTransfer, TransferCommand, TransferError,
    TransferReceipt, TransferRejection, TransferRequest, TransferRequestError,
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
fn preparing_still_leaves_both_balances_unchanged() {
    let mut ledger = two_account_ledger(500, 100);

    let prepared = ledger.prepare_transfer(command(1, 2, 250));

    assert!(prepared.is_ok(), "the transfer should be preparable");
    drop(prepared);

    assert_eq!(ledger.balance(id(1)), Some(money(500)));
    assert_eq!(ledger.balance(id(2)), Some(money(100)));
}

#[test]
fn execute_transfer_moves_money_and_reports_the_receipt() {
    let mut ledger = two_account_ledger(500, 100);

    let receipt = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 250))
        .expect("the transfer should succeed");

    assert_eq!(receipt.source(), id(1));
    assert_eq!(receipt.destination(), id(2));
    assert_eq!(receipt.amount(), money(250));
    assert_eq!(ledger.balance(id(1)), Some(money(250)));
    assert_eq!(ledger.balance(id(2)), Some(money(350)));
}

#[test]
fn a_successful_transfer_preserves_the_combined_balance() {
    let mut ledger = two_account_ledger(500, 100);

    execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 250))
        .expect("the transfer should succeed");

    let source = ledger.balance(id(1)).expect("the source account exists");
    let destination = ledger
        .balance(id(2))
        .expect("the destination account exists");

    assert_eq!(source.cents() + destination.cents(), 600);
}

#[test]
fn a_zero_amount_is_invalid_and_leaves_the_ledger_unchanged() {
    let mut ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 0));

    assert_eq!(
        result,
        Err(TransferError::Invalid(TransferRequestError::ZeroAmount))
    );
    assert_eq!(ledger, before);
}

#[test]
fn a_same_account_transfer_is_invalid_and_leaves_the_ledger_unchanged() {
    let mut ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(1), 250));

    assert_eq!(
        result,
        Err(TransferError::Invalid(TransferRequestError::SameAccount))
    );
    assert_eq!(ledger, before);
}

#[test]
fn a_missing_source_is_rejected_and_leaves_the_ledger_unchanged() {
    let mut ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = execute_transfer(&mut ledger, TransferRequest::new(id(9), id(1), 250));

    assert_eq!(
        result,
        Err(TransferError::Rejected(TransferRejection::SourceNotFound))
    );
    assert_eq!(ledger, before);
}

#[test]
fn a_missing_destination_is_rejected_and_leaves_the_ledger_unchanged() {
    let mut ledger = two_account_ledger(500, 100);
    let before = ledger.clone();

    let result = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(9), 250));

    assert_eq!(
        result,
        Err(TransferError::Rejected(
            TransferRejection::DestinationNotFound
        ))
    );
    assert_eq!(ledger, before);
}

#[test]
fn insufficient_funds_is_rejected_and_leaves_the_ledger_unchanged() {
    let mut ledger = two_account_ledger(100, 100);
    let before = ledger.clone();

    let result = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 250));

    assert_eq!(
        result,
        Err(TransferError::Rejected(TransferRejection::InsufficientFunds))
    );
    assert_eq!(ledger, before);
}

#[test]
fn destination_overflow_is_rejected_and_leaves_the_ledger_unchanged() {
    let mut ledger = two_account_ledger(500, u64::MAX);
    let before = ledger.clone();

    let result = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 250));

    assert_eq!(
        result,
        Err(TransferError::Rejected(
            TransferRejection::DestinationOverflow
        ))
    );
    assert_eq!(ledger, before);
}

#[test]
fn a_rejection_leaves_the_ledger_usable_for_a_later_transfer() {
    let mut ledger = two_account_ledger(500, 100);

    let rejected = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 900));
    assert_eq!(
        rejected,
        Err(TransferError::Rejected(TransferRejection::InsufficientFunds))
    );

    let receipt = execute_transfer(&mut ledger, TransferRequest::new(id(1), id(2), 400))
        .expect("the ledger still accepts a valid transfer");

    assert_eq!(receipt.amount(), money(400));
    assert_eq!(ledger.balance(id(1)), Some(money(100)));
    assert_eq!(ledger.balance(id(2)), Some(money(500)));
}

#[test]
fn commit_is_consuming_and_infallible() {
    // The parameter type forces a by-value receiver and an outcome return type,
    // so a `&mut self` or `Result`-returning commit would not coerce here.
    fn assert_signature<'a>(commit: fn(PreparedTransfer<'a>) -> TransferReceipt) {
        let _ = commit;
    }

    assert_signature(PreparedTransfer::commit);
}
