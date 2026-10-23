# Rust Daily Arc Specification: Validate -> Prepare -> Commit

**Status:** implementation-ready curriculum specification  
**Repository:** `matrizaev/rust-daily`  
**Placement:** immediately after `asteroids-domain`  
**Global lesson orders:** 98-102  
**Arc ID:** `validate-prepare-commit`  
**Target lesson count:** 5  
**Primary pillar:** architecture  
**Dependency set:** `std`

## 1. Purpose

This arc teaches a production Rust design pattern that is more important than the individual syntax involved:

> Perform every recoverable check before authoritative mutation, represent successfully prepared work as a capability, and make the commit step consuming and infallible.

The learner should finish the arc understanding the following pipeline as a design tool, not as a framework:

```text
raw request
    |
    | shape/invariant validation -- may fail, does not touch state
    v
TransferCommand
    |
    | state-dependent preparation -- may fail, does not mutate balances
    v
PreparedTransfer<'a>
    |
    | commit(self) -- authoritative mutation, no Result
    v
TransferReceipt
```

The arc deliberately follows the Asteroids arc but starts a small ledger/transfer domain instead of forcing transaction semantics into the game. Asteroids is excellent for state machines and composed domain behavior; a transfer is better for this concept because insufficient funds, missing accounts, arithmetic overflow, state drift, and one-shot mutation are genuine domain concerns rather than invented failure modes.

The design is intentionally small. It does not introduce persistence, async work, a repository trait, SQL transactions, a generic typestate library, or a service framework. The pattern must be visible in ordinary Rust types, ownership, borrowing, `Result`, and consuming methods.

## 2. Repository alignment

The current repository ends `asteroids-domain` at global order 97 with `game-session-007`. The curriculum scaffolder requires new lesson directory names to begin with the next global order, so this arc uses `098-...` through `102-...`.

The arc follows the maintained curriculum rules:

- 5 focused lessons;
- one primary concept per lesson;
- one editable artifact, `src/lib.rs`;
- prior authored solutions become the next starter;
- public tests validate behavior, not implementation trivia;
- compile-fail cases are used only for meaningful API/ownership contracts;
- the final solution has no `assert!` or `debug_assert!` in production code;
- no fallible work is permitted after the authoritative commit boundary.

Using `src/lib.rs` as the editable artifact is intentional. The current scaffolder requires `src/lib.rs` to be editable or copied from a previous lesson, and a first lesson in a new arc has no previous readonly snapshot. Keeping the arc in one file also keeps each daily edit local. A later crate/module-design arc may split the final code without changing the semantics taught here.

## 3. Arc registration

The final `lessons/arcs.json` entry should be:

```json
{
  "id": "validate-prepare-commit",
  "title": "Validate, prepare, then commit",
  "pillar": "architecture",
  "orderStart": 98,
  "targetLessonCount": 5,
  "description": "Stage a state-changing operation so raw input is validated, all state-dependent failures are resolved before mutation, prepared work holds the authority it needs, and commit is consuming and infallible."
}
```

Do not pass a fixed `--arc-length 5` while scaffolding the first lesson. The current scaffolder treats the authored lesson count as the arc length and automatically updates earlier lessons as new lessons are added. After lesson 102 is scaffolded, all five lesson records should have `arcLength: 5`.

## 4. Learning outcomes

By the end of lesson 102, the learner must be able to explain and demonstrate all of these points:

1. A raw request and a validated command are different types because they represent different guarantees.
2. Validation that depends only on the request should happen before mutable application state is borrowed.
3. Preparation may inspect current state and perform checked arithmetic, lookups, policy checks, or other recoverable work, but must leave authoritative state unchanged on both success and failure.
4. A prepared operation should carry the exact capability needed for commit. In this arc, `PreparedTransfer<'a>` holds exclusive mutable references to the two accounts it is allowed to change.
5. Binding prepared work to `&mut` references prevents unrelated mutation from making the preparation stale.
6. `commit(self)` consumes the prepared operation, so the same authority cannot be replayed.
7. Commit returns a domain outcome, not `Result`, because every expected failure has already been resolved.
8. Post-state should be computed during preparation when doing so removes arithmetic or validation from commit.
9. Public construction of prepared capabilities is dangerous. Their fields remain private and no public constructor exists.
10. The orchestration function should read visibly as `validate -> prepare -> commit` and should preserve state exactly on every pre-commit failure.

## 5. Non-goals

Do not add any of the following in this arc:

- database transactions or persistence;
- async Rust;
- trait-based repositories;
- `Arc`, `Mutex`, `RwLock`, `RefCell`, or interior mutability;
- a reusable generic `Prepared<T>` abstraction;
- a generic state-machine/typestate framework;
- macros;
- event sourcing;
- rollback after commit;
- production `assert!`, `debug_assert!`, `panic!`, or `unreachable!` used as invariant enforcement;
- hidden mutation in preparation;
- cloning a prepared operation to work around ownership.

The point is to teach the underlying Rust design pressure before adding infrastructure.

## 6. Final target design

The final public surface at the end of lesson 102 is:

```rust
pub struct AccountId(/* private */);
pub struct Money(/* private */);
pub struct Ledger { /* private */ }

pub struct TransferRequest { /* private */ }
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

pub struct TransferCommand { /* private */ }
impl TryFrom<TransferRequest> for TransferCommand { /* ... */ }

pub enum TransferRejection {
    SourceNotFound,
    DestinationNotFound,
    InsufficientFunds,
    DestinationOverflow,
}

pub struct PreparedTransfer<'a> {
    /* private exclusive account capabilities + precomputed post-state */
}

impl PreparedTransfer<'_> {
    pub fn commit(self) -> TransferReceipt;
}

pub struct TransferReceipt { /* private */ }

pub enum TransferError {
    Invalid(TransferRequestError),
    Rejected(TransferRejection),
}

pub fn execute_transfer(
    ledger: &mut Ledger,
    request: TransferRequest,
) -> Result<TransferReceipt, TransferError>;
```

### Failure and mutation matrix

| Phase | Input | May fail? | May mutate balances? | Output |
| --- | --- | --- | --- | --- |
| Validate | `TransferRequest` | Yes: same account, zero amount | No | `TransferCommand` |
| Prepare | `&mut Ledger`, `TransferCommand` | Yes: missing account, insufficient funds, destination overflow | No | `PreparedTransfer<'_>` |
| Commit | `PreparedTransfer<'_>` | No recoverable failure | Yes, exactly the two prepared accounts | `TransferReceipt` |
| Orchestrate | request + ledger | Propagates validate/prepare failures | Only after successful prepare | `TransferReceipt` |

The important boundary is the call to `PreparedTransfer::commit`. Everything before that line is allowed to reject. Everything after entering `commit` must be ordinary infallible authoritative mutation and outcome construction.

## 7. Final reference implementation

The final lesson solution should be equivalent to the following. Exact comments may vary, but public API shape and semantics should not.

```rust
use std::collections::HashSet;
use std::num::NonZeroU64;

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

impl Account {
    const fn id(&self) -> AccountId {
        self.id
    }

    const fn balance(&self) -> Money {
        self.balance
    }

    fn set_balance(&mut self, balance: Money) {
        self.balance = balance;
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Ledger {
    accounts: Vec<Account>,
}

impl Ledger {
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

    pub fn balance(&self, id: AccountId) -> Option<Money> {
        self.accounts
            .iter()
            .find(|account| account.id == id)
            .map(Account::balance)
    }

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
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferRequest {
    source: AccountId,
    destination: AccountId,
    amount_cents: u64,
}

impl TransferRequest {
    pub const fn new(
        source: AccountId,
        destination: AccountId,
        amount_cents: u64,
    ) -> Self {
        Self {
            source,
            destination,
            amount_cents,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRequestError {
    SameAccount,
    ZeroAmount,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
struct TransferAmount(NonZeroU64);

impl TransferAmount {
    const fn as_money(self) -> Money {
        Money::from_cents(self.0.get())
    }
}

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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferRejection {
    SourceNotFound,
    DestinationNotFound,
    InsufficientFunds,
    DestinationOverflow,
}

pub struct PreparedTransfer<'a> {
    source: &'a mut Account,
    destination: &'a mut Account,
    amount: Money,
    source_after: Money,
    destination_after: Money,
}

impl Ledger {
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
            // Both accounts were resolved above and TransferCommand guarantees
            // distinct account IDs. This branch is a defensive preparation
            // rejection rather than a production assertion/panic.
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
    pub fn commit(self) -> TransferReceipt {
        let Self {
            source,
            destination,
            amount,
            source_after,
            destination_after,
        } = self;

        let source_id = source.id();
        let destination_id = destination.id();

        source.set_balance(source_after);
        destination.set_balance(destination_after);

        TransferReceipt {
            source: source_id,
            destination: destination_id,
            amount,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransferError {
    Invalid(TransferRequestError),
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

pub fn execute_transfer(
    ledger: &mut Ledger,
    request: TransferRequest,
) -> Result<TransferReceipt, TransferError> {
    let command = TransferCommand::try_from(request)?;
    let prepared = ledger.prepare_transfer(command)?;
    Ok(prepared.commit())
}
```

### Authoring note on `account_pair_mut`

The helper is support code, not the lesson concept. Its purpose is to obtain two distinct mutable account references without unsafe code or interior mutability. It returns `Option` and the final solution converts the theoretically unreachable mismatch into a preparation rejection rather than asserting or panicking. Do not turn this helper into a learner task and do not introduce unsafe code to make it shorter.

## 8. Lesson sequence overview

| Order | Directory | Title | Primary concept | Difficulty |
| --- | --- | --- | --- | --- |
| 98 | `098-validated-transfer-command` | Validate a request into a command | phase-specific validated type | medium |
| 99 | `099-prepare-transfer` | Prepare a transfer without mutating | fallible preparation before mutation | medium |
| 100 | `100-bind-prepared-transfer` | Bind prepared work to exclusive state | borrowed capability prevents stale preparation | advanced |
| 101 | `101-commit-prepared-transfer` | Commit prepared work infallibly | consuming one-shot authoritative commit | advanced |
| 102 | `102-execute-transfer-pipeline` | Compose the staged mutation pipeline | orchestration and atomic failure behavior | advanced |

The sequence is deliberately cumulative. Lesson 99's prepared object is a value-only plan. That is an intentional intermediate design used to isolate the idea that preparation performs all fallible calculations without mutation. Lesson 100 then exposes its weakness - it can become stale - and replaces it with a borrow-bound capability. The completion text for lesson 99 must say explicitly that the design is not yet the final authority model.

## 9. Lesson 98 - Validate a request into a command

### Metadata

- Directory: `lessons/validate-prepare-commit/098-validated-transfer-command/`
- Lesson ID: `validated-transfer-command-098`
- Order: 98
- Day: 1
- Final arc length: 5
- Concept ID: `validated-transfer-command`
- Difficulty: `medium`
- Estimated minutes: 8

### Scenario

A transfer arrives as a request that can represent states the domain must never execute: a zero-value transfer or a transfer from an account to itself. The ledger should not be borrowed until those request-only invariants have been checked.

### Instructions

In `src/lib.rs`, define a private `TransferAmount(NonZeroU64)` value, a `TransferCommand` with private source, destination, and amount fields, and implement `TryFrom<TransferRequest>` so zero amounts and same-account transfers are rejected before any ledger state is accessed. Add getters that expose the validated source, destination, and amount without exposing the internal `TransferAmount` representation.

### Starter shape

Provide the completed `AccountId`, `Money`, `DuplicateAccount`, `Account`, `Ledger`, and `TransferRequest` support types. Provide `TransferRequestError` with `SameAccount` and `ZeroAmount`. Leave the validated amount, command, and conversion as the learner task.

The starter should include a focused TODO immediately above the transfer command section. Do not leave TODOs in ledger support code.

### Required public behavior

`tests/public.rs` must prove:

1. `TransferCommand::try_from` accepts a positive transfer between distinct accounts.
2. The command getters return the exact source, destination, and amount.
3. A zero amount returns `TransferRequestError::ZeroAmount`.
4. A same-account request returns `TransferRequestError::SameAccount`.

### Compile-fail contract

Add `compile_fail/transfer_command_direct_construction.rs`:

```rust
use rust_daily_lesson::{AccountId, TransferCommand};

fn main() {
    let id = AccountId::new(1);
    let _ = TransferCommand {
        source: id,
        destination: AccountId::new(2),
        amount: todo!(),
    };
}
```

Expected diagnostic substring: `private`.

The purpose is not to test compiler wording precisely. It proves external callers cannot bypass request validation with a struct literal.

### Suggested structural validation

Use structural checks only for stable API shape:

```json
{
  "mode": "structural",
  "timeoutMs": 10000,
  "checks": [
    {
      "type": "tuple_struct_fields",
      "structName": "TransferAmount",
      "requiredTypes": ["NonZeroU64"]
    },
    {
      "type": "struct_fields",
      "structName": "TransferCommand",
      "requiredFields": [
        {"name": "source", "typeIncludes": ["AccountId"]},
        {"name": "destination", "typeIncludes": ["AccountId"]},
        {"name": "amount", "typeIncludes": ["TransferAmount"]}
      ]
    }
  ]
}
```

Cargo tests remain authoritative for behavior.

### Hints

- Hint 1: Separate "the request was supplied" from "the request is legal to execute" with a second type.
- Hint 2: `NonZeroU64::new` turns the zero check into a type invariant; reject `source == destination` before constructing the command.
- Hint 3: exact authored solution for the lesson.

### Completion explanation

Explain that `TransferCommand` is evidence that request-only validation has succeeded. Preparation can therefore accept a command instead of rechecking zero or same-account rules. Private fields matter because a validated type is only useful when external code cannot forge it.

### Author notes / reject these solutions

Reject:

- storing the amount as plain `u64` in `TransferCommand`;
- making command fields public;
- adding `TransferCommand::new` that accepts unchecked values;
- reading the ledger during `TryFrom`;
- returning strings as errors;
- using `assert!` for zero or same-account validation.

## 10. Lesson 99 - Prepare a transfer without mutating

### Metadata

- Directory: `099-prepare-transfer`
- Lesson ID: `prepare-transfer-099`
- Order: 99
- Day: 2
- Concept ID: `prepare-before-mutation`
- Difficulty: `medium`
- Estimated minutes: 10

### Scenario

A validated command still may not be executable against current state. The source or destination may be missing, the source may not have enough money, or crediting the destination may overflow. These failures must be resolved before balances change.

### Instructions

Add `TransferRejection`, a value-only `PreparedTransfer`, and `Ledger::prepare_transfer(&self, command)`. Preparation must resolve both accounts, calculate both post-transfer balances with checked arithmetic, and return a prepared value without changing the ledger. A rejected preparation must also leave the ledger unchanged.

### Reference shape for this lesson only

At the end of lesson 99, before the borrow-bound refactor, the prepared type should look like:

```rust
pub struct PreparedTransfer {
    source: AccountId,
    destination: AccountId,
    amount: Money,
    source_after: Money,
    destination_after: Money,
}
```

and:

```rust
impl Ledger {
    pub fn prepare_transfer(
        &self,
        command: TransferCommand,
    ) -> Result<PreparedTransfer, TransferRejection> {
        // lookups + checked arithmetic only; no mutation
    }
}
```

Do not add `commit` yet.

### Required rejection enum

```rust
pub enum TransferRejection {
    SourceNotFound,
    DestinationNotFound,
    InsufficientFunds,
    DestinationOverflow,
}
```

### Public tests

Test all of the following:

- valid preparation returns `Ok` and both balances are unchanged;
- missing source returns `SourceNotFound` and the ledger equals its pre-call clone;
- missing destination returns `DestinationNotFound` and state is unchanged;
- insufficient funds returns `InsufficientFunds` and state is unchanged;
- `u64::MAX` destination plus a positive amount returns `DestinationOverflow` and state is unchanged.

The state-equality assertions are essential. The lesson is not merely about returning the right error; it is about failure occurring before mutation.

### Structural validation

Require:

- `TransferRejection` with the four unit variants;
- `PreparedTransfer` fields `source_after` and `destination_after` of `Money`;
- `prepare_transfer` signature includes `&self`, `TransferCommand`, and `Result<PreparedTransfer, TransferRejection>`.

Do not structurally prescribe local variable names or a particular sequence of `checked_*` calls.

### Hints

- Hint 1: Treat preparation as a calculation over the current ledger, not as a partial transfer.
- Hint 2: Use `checked_sub` for the source and `checked_add` for the destination; save the successful results in `PreparedTransfer`.
- Hint 3: exact authored solution.

### Completion explanation

State explicitly: preparation now moves every expected lookup/arithmetic failure before mutation, but the prepared value is only a snapshot. Another mutation could make its stored post-state stale before commit. Lesson 100 fixes that by making preparation hold exclusive authority over the affected accounts.

### Author notes / reject these solutions

Reject:

- decrementing the source before checking destination overflow;
- mutating and then restoring on error;
- making `prepare_transfer` take `&mut self` but still returning only IDs and copied balances in this lesson;
- using saturating arithmetic;
- using unchecked `+` or `-` for the post-state calculation;
- adding commit early.

## 11. Lesson 100 - Bind prepared work to exclusive state

### Metadata

- Directory: `100-bind-prepared-transfer`
- Lesson ID: `bind-prepared-transfer-100`
- Order: 100
- Day: 3
- Concept ID: `borrow-bound-preparation`
- Difficulty: `advanced`
- Estimated minutes: 10

### Scenario

The value-only plan from lesson 99 can outlive the state it was calculated from. The fix is not a version counter or another validation pass. In a local synchronous Rust API, the prepared operation can borrow the exact mutable state it is authorized to change and keep that borrow until commit.

### Instructions

Refactor `PreparedTransfer` to `PreparedTransfer<'a>` holding `&'a mut Account` for source and destination. Change `Ledger::prepare_transfer` to take `&mut self` and return `PreparedTransfer<'_>`. Keep all existing rejection behavior and keep balances unchanged during preparation.

The prepared type must not implement or derive `Clone` or `Copy`.

### Target shape

```rust
pub struct PreparedTransfer<'a> {
    source: &'a mut Account,
    destination: &'a mut Account,
    amount: Money,
    source_after: Money,
    destination_after: Money,
}
```

The fields stay private. `Account` stays private.

### Public tests

Retain lesson 99's behavioral preparation tests. They must still pass after the signature becomes mutable/borrowed.

### Compile-fail case 1: prepared borrow blocks ledger reborrow

`compile_fail/prepared_blocks_ledger_reborrow.rs` should create a ledger, validate a command, prepare it, then try to call `ledger.balance(...)` before the prepared value is dropped/consumed, while using the prepared value afterward so non-lexical lifetimes cannot end the borrow early.

Expected diagnostic substring: `cannot borrow`.

Conceptual fixture:

```rust
let prepared = ledger.prepare_transfer(command).unwrap();
let _balance = ledger.balance(source); // must not compile
let _keep_borrow_alive = prepared;
```

### Compile-fail case 2: prepared transfer is not copyable

`compile_fail/prepared_not_copy.rs`:

```rust
let prepared = ledger.prepare_transfer(command).unwrap();
let duplicate = prepared;
let _original = prepared; // must not compile
let _ = duplicate;
```

Expected diagnostic substring: `moved`.

### Structural validation

Require `PreparedTransfer` to include mutable borrowed account fields. A structural check may use `struct_fields` with type fragments containing `mut Account`, but do not require an exact lifetime name beyond the public type having a lifetime parameter.

### Hints

- Hint 1: A prepared value should not merely describe authority; it can hold the authority as a borrow.
- Hint 2: Resolve the checked post-balances first, then obtain two distinct `&mut Account` references and store them in `PreparedTransfer<'_>`.
- Hint 3: exact authored solution.

### Completion explanation

The key idea is that `PreparedTransfer<'a>` is now a capability, not just data. While it exists, the ledger cannot be independently borrowed in a way that could invalidate the prepared assumptions. Rust's borrow checker is enforcing transaction-local authority for this in-memory operation.

### Author notes / reject these solutions

Reject:

- `Rc<RefCell<Account>>`;
- raw pointers or `unsafe`;
- storing account IDs instead of references while claiming stale-state protection;
- cloning accounts into the prepared object;
- adding a second "revalidate" call immediately before commit;
- deriving `Clone`/`Copy` on `PreparedTransfer`;
- broadening the borrow to unrelated global state when two account references are enough.

## 12. Lesson 101 - Commit prepared work infallibly

### Metadata

- Directory: `101-commit-prepared-transfer`
- Lesson ID: `commit-prepared-transfer-101`
- Order: 101
- Day: 4
- Concept ID: `consuming-infallible-commit`
- Difficulty: `advanced`
- Estimated minutes: 9

### Scenario

Preparation has already resolved existence, funds, overflow, and state ownership. Commit should therefore stop behaving like another validation function. It should consume the prepared capability, perform only the precomputed mutation, and return an outcome.

### Instructions

Add `TransferReceipt` and implement `PreparedTransfer::commit(self) -> TransferReceipt`. Commit must assign the two post-balances already calculated by preparation and construct the receipt. It must not return `Result` or `Option`, perform account lookup, perform checked arithmetic, or revalidate the request.

### Required receipt

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TransferReceipt {
    source: AccountId,
    destination: AccountId,
    amount: Money,
}
```

Provide simple getters.

### Public tests

Test:

1. Successful preparation still leaves both balances unchanged before commit.
2. After `commit`, source and destination have exactly the precomputed balances.
3. The receipt contains exact source, destination, and amount values.
4. Total money across the two accounts is preserved on successful transfer.
5. The method signature is consuming and infallible. Use a type check equivalent to:

```rust
let _: for<'a> fn(PreparedTransfer<'a>) -> TransferReceipt =
    PreparedTransfer::commit;
```

This is stronger and less formatting-sensitive than a textual check for absence of `Result`.

### Compile-fail case 1: commit cannot be replayed

`compile_fail/prepared_commit_twice.rs`:

```rust
let prepared = ledger.prepare_transfer(command).unwrap();
let _first = prepared.commit();
let _second = prepared.commit(); // moved value
```

Expected diagnostic substring: `moved`.

### Compile-fail case 2: prepared capability cannot be forged

`compile_fail/prepared_direct_construction.rs` should attempt a struct literal for `PreparedTransfer`. Expected diagnostic substring: `private`.

It is acceptable if rustc reports the private `Account` type or private fields; the fixture's purpose is simply to prove no external constructor path exists.

### Hints

- Hint 1: If commit still needs to ask "can I?", preparation has not finished its job.
- Hint 2: Destructure `self`, capture the account IDs, assign `source_after` and `destination_after`, then build a receipt.
- Hint 3: exact authored solution.

### Completion explanation

Explain the authoritative boundary clearly: `commit(self)` is where balances change. The receiver is `self`, so the capability is one-shot. The return type is a receipt rather than `Result`, because all expected failure modes were consumed by validation/preparation.

### Author notes / reject these solutions

Reject:

- `commit(&mut self)`;
- `commit(&self)` with interior mutability;
- `Result<TransferReceipt, _>` from commit;
- calling `checked_add`/`checked_sub` inside commit;
- looking up account IDs again;
- applying source mutation before a remaining fallible destination operation;
- adding rollback logic to compensate for fallible commit.

## 13. Lesson 102 - Compose the full pipeline

### Metadata

- Directory: `102-execute-transfer-pipeline`
- Lesson ID: `execute-transfer-pipeline-102`
- Order: 102
- Day: 5
- Concept ID: `staged-mutation-pipeline`
- Difficulty: `advanced`
- Estimated minutes: 10

### Scenario

The individual phases now have useful types and contracts. The application-facing function should compose them without leaking raw requests into preparation or allowing mutation before all recoverable failure has been resolved.

### Instructions

Add `TransferError`, `From` mappings for request and preparation failures, and `execute_transfer(&mut Ledger, TransferRequest) -> Result<TransferReceipt, TransferError>`. Its body should visibly perform exactly three steps: validate the request into `TransferCommand`, prepare against the ledger, then commit the prepared transfer.

### Required orchestration

```rust
pub fn execute_transfer(
    ledger: &mut Ledger,
    request: TransferRequest,
) -> Result<TransferReceipt, TransferError> {
    let command = TransferCommand::try_from(request)?;
    let prepared = ledger.prepare_transfer(command)?;
    Ok(prepared.commit())
}
```

Equivalent naming is acceptable, but do not collapse the phases into one large mutation function.

### Required error type

```rust
pub enum TransferError {
    Invalid(TransferRequestError),
    Rejected(TransferRejection),
}
```

Implement `From<TransferRequestError>` and `From<TransferRejection>` so `?` preserves the phase distinction.

### Final public tests

The final `tests/public.rs` should contain a complete behavioral suite:

- successful transfer updates exact balances and returns exact receipt;
- successful transfer preserves combined balance;
- zero amount -> `Invalid(ZeroAmount)`, ledger unchanged;
- same account -> `Invalid(SameAccount)`, ledger unchanged;
- missing source -> `Rejected(SourceNotFound)`, ledger unchanged;
- missing destination -> `Rejected(DestinationNotFound)`, ledger unchanged;
- insufficient funds -> `Rejected(InsufficientFunds)`, ledger unchanged;
- destination overflow -> `Rejected(DestinationOverflow)`, ledger unchanged;
- a rejection leaves the ledger usable for a later valid transfer;
- commit signature remains the consuming infallible function-pointer shape from lesson 101.

Use a helper that clones the ledger before each failure case and compares it afterward. Do not test private fields.

### Final compile-fail suite

Recreate these fixtures in lesson 102 so the final arc snapshot protects the architectural contracts, rather than relying on compile-fail files from earlier lessons:

1. `transfer_command_direct_construction` -> expected `private`;
2. `prepared_blocks_ledger_reborrow` -> expected `cannot borrow`;
3. `prepared_commit_twice` -> expected `moved`;
4. `prepared_direct_construction` -> expected `private`.

The final lesson should not need the `prepared_not_copy` fixture separately because `prepared_commit_twice` already proves one-shot move semantics in the actual public operation.

### Structural validation

Keep structural checks small:

```json
{
  "type": "function_signature",
  "functionName": "execute_transfer",
  "requiredSignatureIncludes": [
    "&mut Ledger",
    "TransferRequest",
    "Result<TransferReceipt, TransferError>"
  ]
}
```

Behavioral and compile-fail validation should carry most of the contract.

### Hints

- Hint 1: The orchestration function should read like the phase diagram from the arc introduction.
- Hint 2: Convert both phase-specific errors into `TransferError`, then use `?` for validation and preparation; commit itself needs no `?`.
- Hint 3: exact authored solution.

### Completion explanation

The final explanation should connect syntax to architecture: `TryFrom` establishes request invariants; `prepare_transfer` resolves current-state failure while taking exclusive authority; `PreparedTransfer<'_>` prevents stale mutation; `commit(self)` crosses the authoritative boundary once; and `execute_transfer` makes the ordering reviewable at a glance.

Do not claim every operation needs this structure. State that it is valuable when mutation is authoritative and expected failures can be moved ahead of that mutation.

## 14. Concept registrations

After scaffolding, replace the generated concept placeholders with these records (preserving repository sort order):

```json
{
  "id": "validated-transfer-command",
  "name": "Validated command boundary",
  "description": "Convert a raw transfer request into an unforgeable command whose type records request-only invariants before application state is accessed.",
  "prerequisites": ["dto-tryfrom-validation"],
  "difficulty": ["medium"],
  "lessonIds": ["validated-transfer-command-098"],
  "tags": ["validation", "newtypes", "tryfrom", "architecture"],
  "masteryThreshold": 3
}
```

This prerequisite reuses the existing `dto-tryfrom-validation` concept from the DTO conversion arc; do not create a duplicate conversion concept.

```json
{
  "id": "prepare-before-mutation",
  "name": "Prepare before mutation",
  "description": "Resolve state-dependent lookups and checked post-state before authoritative mutation so preparation failures leave state unchanged.",
  "prerequisites": ["validated-transfer-command"],
  "difficulty": ["medium"],
  "lessonIds": ["prepare-transfer-099"],
  "tags": ["transactions", "validation", "state", "architecture"],
  "masteryThreshold": 3
}
```

```json
{
  "id": "borrow-bound-preparation",
  "name": "Borrow-bound prepared capability",
  "description": "Bind prepared work to exclusive mutable references so state cannot drift between preparation and commit.",
  "prerequisites": ["prepare-before-mutation"],
  "difficulty": ["advanced"],
  "lessonIds": ["bind-prepared-transfer-100"],
  "tags": ["borrowing", "lifetimes", "capabilities", "ownership"],
  "masteryThreshold": 3
}
```

```json
{
  "id": "consuming-infallible-commit",
  "name": "Consuming infallible commit",
  "description": "Consume a prepared capability to perform only prevalidated mutation and return an outcome without a recoverable failure channel.",
  "prerequisites": ["borrow-bound-preparation"],
  "difficulty": ["advanced"],
  "lessonIds": ["commit-prepared-transfer-101"],
  "tags": ["ownership", "state-transitions", "api-design", "transactions"],
  "masteryThreshold": 3
}
```

```json
{
  "id": "staged-mutation-pipeline",
  "name": "Staged mutation pipeline",
  "description": "Compose validation, preparation, and consuming commit so expected failures occur before the authoritative mutation boundary.",
  "prerequisites": ["consuming-infallible-commit"],
  "difficulty": ["advanced"],
  "lessonIds": ["execute-transfer-pipeline-102"],
  "tags": ["architecture", "orchestration", "errors", "transactions"],
  "masteryThreshold": 3
}
```

## 15. Scaffolding commands

The current scaffolder enforces global order, registers arcs/concepts, and carries each previous authored solution forward. Run one command at a time, author and validate that lesson, then scaffold the next lesson.

### Lesson 98

```bash
scripts/curriculum/scaffold-lesson \
  --arc validate-prepare-commit \
  --lesson 098-validated-transfer-command \
  --title "Validate a request into a command" \
  --concept validated-transfer-command \
  --difficulty medium \
  --dependency-set std \
  --editable src/lib.rs \
  --estimated-minutes 8 \
  --structural \
  --compile-fail transfer-command-direct-construction \
  --register-arc \
  --arc-title "Validate, prepare, then commit" \
  --arc-pillar architecture \
  --arc-description "Stage a state-changing operation so raw input is validated, all state-dependent failures are resolved before mutation, prepared work holds the authority it needs, and commit is consuming and infallible." \
  --register-concept
```

### Lesson 99

```bash
scripts/curriculum/scaffold-lesson \
  --arc validate-prepare-commit \
  --lesson 099-prepare-transfer \
  --title "Prepare a transfer without mutating" \
  --concept prepare-before-mutation \
  --difficulty medium \
  --dependency-set std \
  --editable src/lib.rs \
  --estimated-minutes 10 \
  --structural \
  --register-concept
```

### Lesson 100

```bash
scripts/curriculum/scaffold-lesson \
  --arc validate-prepare-commit \
  --lesson 100-bind-prepared-transfer \
  --title "Bind prepared work to exclusive state" \
  --concept borrow-bound-preparation \
  --difficulty advanced \
  --dependency-set std \
  --editable src/lib.rs \
  --estimated-minutes 10 \
  --structural \
  --compile-fail prepared-blocks-ledger-reborrow \
  --compile-fail prepared-not-copy \
  --register-concept
```

### Lesson 101

```bash
scripts/curriculum/scaffold-lesson \
  --arc validate-prepare-commit \
  --lesson 101-commit-prepared-transfer \
  --title "Commit prepared work infallibly" \
  --concept consuming-infallible-commit \
  --difficulty advanced \
  --dependency-set std \
  --editable src/lib.rs \
  --estimated-minutes 9 \
  --structural \
  --compile-fail prepared-commit-twice \
  --compile-fail prepared-direct-construction \
  --register-concept
```

### Lesson 102

```bash
scripts/curriculum/scaffold-lesson \
  --arc validate-prepare-commit \
  --lesson 102-execute-transfer-pipeline \
  --title "Compose the staged mutation pipeline" \
  --concept staged-mutation-pipeline \
  --difficulty advanced \
  --dependency-set std \
  --editable src/lib.rs \
  --estimated-minutes 10 \
  --structural \
  --compile-fail transfer-command-direct-construction \
  --compile-fail prepared-blocks-ledger-reborrow \
  --compile-fail prepared-commit-twice \
  --compile-fail prepared-direct-construction \
  --register-concept
```

After each scaffold, replace every `TODO(author)` placeholder in starter, solution, tests, compile-fail fixtures, lesson metadata, hints, explanations, notes, structural checks, and concept registration.

## 16. Lesson JSON authoring rules

For all five lessons:

- `schemaVersion`: 2;
- `arcId`: `validate-prepare-commit`;
- `arcTitle`: `Validate, prepare, then commit`;
- one editable file: `src/lib.rs`;
- one test file: `tests/public.rs`;
- dependency set: `std`;
- validation mode: `all`;
- hint 3 `solutionCode` must exactly match the authored `solution/src/lib.rs` content;
- `author.solutionPath`: `solution`;
- `author.notesPath`: `notes.md`.

Prefer structural checks that describe API shape (`struct_fields`, `tuple_struct_fields`, `impl_method`, `function_signature`) over `source_includes`. Do not add textual checks for incidental formatting or local variable names.

## 17. Public test fixture conventions

Use tiny helpers consistently across the arc:

```rust
fn id(value: u32) -> AccountId {
    AccountId::new(value)
}

fn money(cents: u64) -> Money {
    Money::from_cents(cents)
}

fn two_account_ledger(source: u64, destination: u64) -> Ledger {
    Ledger::try_new([
        (id(1), money(source)),
        (id(2), money(destination)),
    ])
    .expect("fixture account IDs are unique")
}
```

`expect` in tests is acceptable for known-valid fixture construction. Do not copy test panics/expectations into production solution code.

For failure atomicity, use:

```rust
let before = ledger.clone();
let result = execute_transfer(&mut ledger, request);
assert_eq!(result, expected_error);
assert_eq!(ledger, before);
```

This checks the externally meaningful contract directly.

## 18. Final author notes

Each lesson's `notes.md` should include at least these points.

### Concept boundary

The arc is about ordering fallibility and authority around mutation. It is not an introduction to `Result`, `TryFrom`, `NonZeroU64`, lifetimes, or error enums in isolation; those are already-established tools being composed into a stronger design.

### Intended solution

Prefer concrete types and direct ownership. The reference solution should remain small enough that the learner can see the transition from raw request to command to prepared capability to receipt without a framework hiding it.

### Validation strategy

- Public tests prove successful behavior and unchanged state on every pre-commit rejection.
- Compile-fail cases prove non-forgeability, exclusive borrow authority, and one-shot consumption.
- Structural checks only protect stable API shape.
- No test should inspect private fields.

### Common wrong solutions

Across the arc, reject:

- mutate-then-rollback;
- post-commit `Result` caused by work that could have been prepared;
- re-running validation after mutation has begun;
- raw IDs/amounts flowing directly into commit;
- `Clone`/`Copy` prepared operations;
- public prepared constructors/fields;
- interior mutability used to evade borrowing;
- one giant `execute_transfer` that interleaves checks and mutation while merely producing the same outputs;
- production assertions standing in for type or phase design.

### Arc continuity

Each new starter must be the previous lesson's authored solution plus only the new focused TODO. Earlier behavior and tests should remain active unless the lesson explicitly migrates an API (lesson 100 intentionally changes `PreparedTransfer` and `prepare_transfer` from value-only to borrow-bound).

## 19. Validation and implementation sequence

For each lesson:

```bash
scripts/curriculum/validate-source
scripts/curriculum/generate
scripts/curriculum/check-generated
scripts/test-lesson-solutions.sh lessons/validate-prepare-commit
```

For normal changed-work validation:

```bash
scripts/curriculum/author-check
```

After the final lesson, also run the repository's normal top-level validation (`make check` or the current equivalent if renamed).

Do not proceed to lesson N+1 while lesson N still contains author placeholders or failing solution/compile-fail tests, because the scaffolder copies the previous authored solution into the next starter.

## 20. Definition of done

The arc is ready to merge only when all of the following are true:

- `lessons/arcs.json` contains the final 98/5 arc record;
- all five concept records have correct prerequisites and no duplicate existing concept IDs;
- lessons 98-102 have sequential global order and day 1-5;
- every lesson reports `arcLength: 5` after the fifth scaffold;
- each lesson has exactly one editable artifact (`src/lib.rs`);
- every starter contains only the focused unfinished work for that day;
- every solution passes its public tests;
- every compile-fail fixture fails for the intended ownership/privacy reason;
- hint 3 matches the authored solution exactly;
- lesson 99 explicitly labels value-only preparation as an intermediate design;
- lesson 100 proves the prepared operation blocks independent ledger access while alive;
- lesson 101 proves commit is `fn(self) -> TransferReceipt`, not a `Result`-returning operation;
- lesson 102 proves every invalid/rejected path leaves the entire ledger unchanged;
- no production `assert!`, `debug_assert!`, `panic!`, `unreachable!`, unsafe code, or interior-mutability workaround is introduced;
- `scripts/curriculum/author-check` passes;
- final repository validation passes.

## 21. Why this arc belongs immediately after Asteroids

The Asteroids arc teaches domain types, state machines, entity composition, and a session-level update. This arc changes the question from "how do I represent state?" to "how do I control authority over a state change?"

That is the right next abstraction step:

```text
Asteroids:
model valid state and behavior

        v

Validate -> Prepare -> Commit:
model when mutation is allowed, who owns the authority to perform it,
and which failures must happen before that authority is exercised
```

The same idea later transfers directly to persistence, inventory operations, durable ID allocation, command handling, protocol boundaries, and other Rustshire-style workflows without teaching any Rustshire-specific mechanics.

## 22. Follow-on arc boundary

Do not extend this arc into intents/events/projections. The natural next architecture arc can start from the completed transfer pipeline and teach that a controller/adapter produces intent, application/domain code commits it, and downstream consumers receive an event/outcome rather than mutable state access.

Keeping that work separate prevents this arc from turning into a general architecture survey and preserves one clear learning objective: **all recoverable failure before authoritative mutation, with the type system carrying the prepared authority.**
