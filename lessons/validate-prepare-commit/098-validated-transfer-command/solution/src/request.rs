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

/// A transfer amount that cannot be zero.
///
/// The inner representation stays private so the only way to build one is the
/// checked conversion in this module.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TransferAmount(NonZeroU64);

impl TransferAmount {
    const fn as_money(self) -> Money {
        Money::from_cents(self.0.get())
    }
}

/// A transfer request that passed every request-only rule.
///
/// The fields are private: `TryFrom<TransferRequest>` is the only way for
/// outside code to obtain a command, so a command is evidence that the request
/// was legal and not merely well formed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferCommand {
    source: AccountId,
    destination: AccountId,
    amount: TransferAmount,
}

impl TransferCommand {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount.as_money()
    }
}

impl TryFrom<TransferRequest> for TransferCommand {
    type Error = TransferRequestError;

    fn try_from(request: TransferRequest) -> Result<Self, Self::Error> {
        if request.source == request.destination {
            return Err(TransferRequestError::SameAccount);
        }

        let Some(amount) = NonZeroU64::new(request.amount_cents) else {
            return Err(TransferRequestError::ZeroAmount);
        };

        Ok(Self {
            source: request.source,
            destination: request.destination,
            amount: TransferAmount(amount),
        })
    }
}
