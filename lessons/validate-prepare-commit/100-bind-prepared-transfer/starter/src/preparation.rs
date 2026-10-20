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

impl Ledger {
    /// Borrow the source and the destination at the same time without `unsafe`
    /// code or interior mutability. Provided support code: use it rather than
    /// rebuilding it.
    fn account_pair_mut(
        &mut self,
        source: AccountId,
        destination: AccountId,
    ) -> Option<(&mut crate::account::Account, &mut crate::account::Account)> {
        if source == destination {
            return None;
        }

        let source_index = self
            .accounts
            .iter()
            .position(|account| account.id == source)?;
        let destination_index = self
            .accounts
            .iter()
            .position(|account| account.id == destination)?;

        if source_index < destination_index {
            let (before_destination, from_destination) =
                self.accounts.split_at_mut(destination_index);
            let source = before_destination.get_mut(source_index)?;
            let destination = from_destination.first_mut()?;
            Some((source, destination))
        } else {
            let (before_source, from_source) = self.accounts.split_at_mut(source_index);
            let destination = before_source.get_mut(destination_index)?;
            let source = from_source.first_mut()?;
            Some((source, destination))
        }
    }
}

// TODO: bind the prepared transfer to the state it is allowed to change.
//
// Replace the value-only `PreparedTransfer` with `PreparedTransfer<'a>` holding
// `&'a mut Account` for the source and the destination, and change
// `Ledger::prepare_transfer` to take `&mut self` and return
// `PreparedTransfer<'_>`. Resolve the account lookups and the checked
// post-state exactly as before, then take the two distinct account references
// from the provided `account_pair_mut` helper. Keep every rejection identical,
// keep both balances unchanged during preparation, and do not derive or
// implement `Clone` or `Copy` on the prepared type.
