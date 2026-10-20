use crate::{AccountId, Money, PreparedTransfer};

/// What a committed transfer did.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferReceipt {
    source: AccountId,
    destination: AccountId,
    amount: Money,
}

impl TransferReceipt {
    pub const fn source(self) -> AccountId {
        self.source
    }

    pub const fn destination(self) -> AccountId {
        self.destination
    }

    pub const fn amount(self) -> Money {
        self.amount
    }
}

impl PreparedTransfer<'_> {
    /// Cross the authoritative boundary: apply the balances that preparation
    /// already computed and report what happened.
    ///
    /// Consuming `self` makes the capability one-shot, and there is no failure
    /// channel because nothing recoverable is left to discover.
    pub fn commit(self) -> TransferReceipt {
        let Self {
            source,
            destination,
            amount,
            source_after,
            destination_after,
        } = self;

        let source_id = source.id;
        let destination_id = destination.id;

        source.balance = source_after;
        destination.balance = destination_after;

        TransferReceipt {
            source: source_id,
            destination: destination_id,
            amount,
        }
    }
}
