use rust_daily_lesson::{AccountId, Ledger, Money, TransferCommand, TransferRequest};

fn main() {
    let mut ledger = Ledger::try_new([
        (AccountId::new(1), Money::from_cents(500)),
        (AccountId::new(2), Money::from_cents(100)),
    ])
    .unwrap();

    let command = TransferCommand::try_from(TransferRequest::new(
        AccountId::new(1),
        AccountId::new(2),
        250,
    ))
    .unwrap();

    let prepared = ledger.prepare_transfer(command).unwrap();
    let duplicate = prepared;
    let _original = prepared;
    let _ = duplicate;
}
