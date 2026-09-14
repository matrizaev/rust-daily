//! Ledger support types for the validate -> prepare -> commit arc.
//!
//! Account identity, money, and the account store are provided. The boundary
//! that turns a raw transfer request into work the ledger is allowed to execute
//! is the part that grows lesson by lesson in this file.

use std::collections::HashSet;

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

// TODO: add the validated transfer command.
//
// Define a private `TransferAmount(NonZeroU64)` value, give `TransferCommand`
// private `source`, `destination`, and `amount` fields, and implement
// `TryFrom<TransferRequest>` so a zero amount or a same-account request is
// rejected with `TransferRequestError` before any ledger state is read. Expose
// the validated source, destination, and amount through getters.
