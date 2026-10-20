use crate::account::Account;
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

/// The two accounts a transfer has resolved, borrowed for the whole time the
/// preparation is alive.
///
/// The exclusive borrows are the capability: while a `PreparedTransfer` exists,
/// nothing else can read or write the two accounts, so the post-state it holds
/// cannot go stale. The fields stay private and no constructor is public.
#[derive(Debug)]
pub struct PreparedTransfer<'a> {
    pub(super) source: &'a mut Account,
    pub(super) destination: &'a mut Account,
    pub(super) amount: Money,
    pub(super) source_after: Money,
    pub(super) destination_after: Money,
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

    /// Resolve every state-dependent failure and keep exclusive authority over
    /// the two accounts the transfer is allowed to change.
    pub fn prepare_transfer(
        &mut self,
        command: TransferCommand,
    ) -> Result<PreparedTransfer<'_>, TransferRejection> {
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

        let Some((source, destination)) =
            self.account_pair_mut(command.source(), command.destination())
        else {
            // Both accounts were resolved above and `TransferCommand` guarantees
            // distinct account IDs, so this is a defensive preparation
            // rejection rather than an assertion or a panic.
            return Err(TransferRejection::SourceNotFound);
        };

        Ok(PreparedTransfer {
            source,
            destination,
            amount,
            source_after,
            destination_after,
        })
    }
}
