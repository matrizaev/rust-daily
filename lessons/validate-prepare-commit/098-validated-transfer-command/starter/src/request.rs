use crate::{AccountId, Money};
use std::num::NonZeroU64;

/// A transfer exactly as the caller supplied it.
///
/// A request can still describe work the domain must never execute: a transfer
/// to the same account or a transfer of nothing.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferRequest {
    source: AccountId,
    destination: AccountId,
    amount_cents: u64,
}

impl TransferRequest {
    pub const fn new(source: AccountId, destination: AccountId, amount_cents: u64) -> Self {
        Self {
            source,
            destination,
            amount_cents,
        }
    }
}

/// The request-only reasons a transfer must not be executed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

// TODO: add the validated transfer command.
//
// Define a private `TransferAmount(NonZeroU64)` value, give `TransferCommand`
// private `source`, `destination`, and `amount` fields, and implement
// `TryFrom<TransferRequest>` so a zero amount or a same-account request is
// rejected with `TransferRequestError` before any ledger state is read. Expose
// the validated source, destination, and amount through getters.
