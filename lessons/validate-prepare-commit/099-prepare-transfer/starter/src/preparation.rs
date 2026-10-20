use crate::{Ledger, Money, TransferCommand};

// TODO: prepare the transfer before anything mutates.
//
// Add private `checked_add` and `checked_sub` helpers to `Money`, add a
// `TransferRejection` enum with `SourceNotFound`, `DestinationNotFound`,
// `InsufficientFunds`, and `DestinationOverflow`, and add a value-only
// `PreparedTransfer` that stores the source, destination, amount, and both
// post-transfer balances. Then implement `Ledger::prepare_transfer(&self,
// command)` so it resolves both accounts and computes both post-state balances
// with checked arithmetic, returning the prepared value without changing a
// single balance. Rejected preparations must leave the ledger unchanged too,
// and `commit` does not exist yet.
