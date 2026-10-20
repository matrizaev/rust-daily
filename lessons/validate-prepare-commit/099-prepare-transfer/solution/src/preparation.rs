use crate::{AccountId, Ledger, Money, TransferCommand};

impl Money {
    fn checked_add(self, rhs: Self) -> Option<Self> {
        self.cents().checked_add(rhs.cents()).map(Self::from_cents)
    }

    fn checked_sub(self, rhs: Self) -> Option<Self> {
        self.cents().checked_sub(rhs.cents()).map(Self::from_cents)
    }
}

/// The state-dependent reasons a validated command cannot be prepared.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRejection {
    SourceNotFound,
    DestinationNotFound,
    InsufficientFunds,
    DestinationOverflow,
}

/// Everything a transfer needs once current ledger state has been resolved.
///
/// This is a plan, not a permission: it records which accounts are involved and
/// which balances they should hold afterwards, but nothing here can reach the
/// ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct PreparedTransfer {
    source: AccountId,
    destination: AccountId,
    amount: Money,
    source_after: Money,
    destination_after: Money,
}

impl Ledger {
    /// Resolve every state-dependent failure before anything is mutated.
    pub fn prepare_transfer(
        &self,
        command: TransferCommand,
    ) -> Result<PreparedTransfer, TransferRejection> {
        let amount = command.amount();

        let source_balance = self
            .balance(command.source())
            .ok_or(TransferRejection::SourceNotFound)?;
        let destination_balance = self
            .balance(command.destination())
            .ok_or(TransferRejection::DestinationNotFound)?;

        let source_after = source_balance
            .checked_sub(amount)
            .ok_or(TransferRejection::InsufficientFunds)?;
        let destination_after = destination_balance
            .checked_add(amount)
            .ok_or(TransferRejection::DestinationOverflow)?;

        Ok(PreparedTransfer {
            source: command.source(),
            destination: command.destination(),
            amount,
            source_after,
            destination_after,
        })
    }
}
