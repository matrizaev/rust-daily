use crate::{AccountId, Money, PreparedTransfer};

// TODO: cross the authoritative boundary once.
//
// Add a `TransferReceipt` with private `source`, `destination`, and `amount`
// fields plus getters for each, then implement
// `PreparedTransfer::commit(self) -> TransferReceipt`. Commit assigns the two
// balances that preparation already computed and builds the receipt from the
// two account IDs and the amount. It must not return `Result` or `Option`, look
// an account up again, run checked arithmetic, or revalidate the request: every
// expected failure was consumed by preparation.
