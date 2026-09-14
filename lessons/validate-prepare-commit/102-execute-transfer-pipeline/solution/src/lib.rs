//! Ledger support types for the validate -> prepare -> commit arc.
//!
//! Account identity, money, and the account store are provided. The boundary
//! that turns a raw transfer request into work the ledger is allowed to execute
//! is the part that grows lesson by lesson in this file.

use std::collections::HashSet;
use std::num::NonZeroU64;

/// Identifies one account held by the ledger.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct AccountId(u32);

impl AccountId {
    pub const fn new(value: u32) -> Self {
        Self(value)
    }

    pub const fn value(self) -> u32 {
        self.0
    }
}

/// An amount in whole cents. Money carries no sign; direction comes from the
/// transfer that moves it.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub struct Money(u64);

impl Money {
    pub const fn from_cents(cents: u64) -> Self {
        Self(cents)
    }

    pub const fn cents(self) -> u64 {
        self.0
    }

    fn checked_add(self, rhs: Self) -> Option<Self> {
        self.0.checked_add(rhs.0).map(Self)
    }

    fn checked_sub(self, rhs: Self) -> Option<Self> {
        self.0.checked_sub(rhs.0).map(Self)
    }
}

/// Returned when a ledger is built from entries that repeat an account ID.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct DuplicateAccount(AccountId);

impl DuplicateAccount {
    pub const fn id(self) -> AccountId {
        self.0
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct Account {
    id: AccountId,
    balance: Money,
}

/// The in-memory account store that later lessons mutate.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ledger {
    accounts: Vec<Account>,
}

impl Ledger {
    /// Build a ledger, rejecting an entry that repeats an account ID.
    pub fn try_new(
        entries: impl IntoIterator<Item = (AccountId, Money)>,
    ) -> Result<Self, DuplicateAccount> {
        let mut ids = HashSet::new();
        let mut accounts = Vec::new();

        for (id, balance) in entries {
            if !ids.insert(id) {
                return Err(DuplicateAccount(id));
            }
            accounts.push(Account { id, balance });
        }

        Ok(Self { accounts })
    }

    /// The balance of one account, if this ledger holds it.
    pub fn balance(&self, id: AccountId) -> Option<Money> {
        self.accounts
            .iter()
            .find(|account| account.id == id)
            .map(|account| account.balance)
    }
}

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
    source: &'a mut Account,
    destination: &'a mut Account,
    amount: Money,
    source_after: Money,
    destination_after: Money,
}

impl Ledger {
    /// Borrow the source and the destination at the same time without `unsafe`
    /// code or interior mutability. Provided support code: use it rather than
    /// rebuilding it.
    fn account_pair_mut(
        &mut self,
        source: AccountId,
        destination: AccountId,
    ) -> Option<(&mut Account, &mut Account)> {
        if source == destination {
            return None;
        }

        let source_index = self.accounts.iter().position(|account| account.id == source)?;
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

/// Everything that can stop a transfer before the authoritative boundary.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferError {
    /// The request itself was not legal to execute.
    Invalid(TransferRequestError),
    /// The request was legal, but current ledger state rejected it.
    Rejected(TransferRejection),
}

impl From<TransferRequestError> for TransferError {
    fn from(error: TransferRequestError) -> Self {
        Self::Invalid(error)
    }
}

impl From<TransferRejection> for TransferError {
    fn from(error: TransferRejection) -> Self {
        Self::Rejected(error)
    }
}

/// Validate the request, prepare it against the ledger, then commit.
///
/// The three phases stay visible on purpose: everything that can fail happens
/// before `commit` is called, and `commit` itself has no `?` to write.
pub fn execute_transfer(
    ledger: &mut Ledger,
    request: TransferRequest,
) -> Result<TransferReceipt, TransferError> {
    let command = TransferCommand::try_from(request)?;
    let prepared = ledger.prepare_transfer(command)?;
    Ok(prepared.commit())
}
