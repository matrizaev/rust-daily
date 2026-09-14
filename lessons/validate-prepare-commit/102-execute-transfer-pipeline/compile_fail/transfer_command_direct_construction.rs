use rust_daily_lesson::{AccountId, TransferCommand};

fn main() {
    let id = AccountId::new(1);
    let _ = TransferCommand {
        source: id,
        destination: AccountId::new(2),
        amount: todo!(),
    };
}
