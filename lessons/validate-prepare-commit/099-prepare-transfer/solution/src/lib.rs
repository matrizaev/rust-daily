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
