# Author Notes

## Concept Boundary

One concept: the authoritative boundary is a consuming, infallible method.
`commit(self)` is the only place balances change, it can be called exactly once,
and it has no recoverable failure channel because everything recoverable was
already resolved. This lesson is not about `Result` or ownership in isolation;
it is about where fallibility is allowed to live relative to mutation.

## Intended Solution

Add a `TransferReceipt` carrying the two account IDs and the amount with
getters, then implement `PreparedTransfer::commit(self) -> TransferReceipt`:
destructure the capability, capture the two account IDs, assign the two
precomputed balances through the exclusive borrows, and build the receipt.
Nothing in the body can fail, so the return type is an outcome rather than a
`Result`.

## Validation Strategy

The Cargo tests keep every earlier behavior and add the commit contract:
preparation still leaves both balances untouched, committing applies exactly the
precomputed balances, the receipt reports the exact source, destination, and
amount, and the combined balance is preserved. The signature test coerces
`PreparedTransfer::commit` to `for<'a> fn(PreparedTransfer<'a>) ->
TransferReceipt`, which proves consuming and infallible in one type-level
assertion instead of a textual check. The compile-fail fixtures prove the
capability cannot be replayed (`moved` after the first commit) and cannot be
forged from outside the module (`private`).

## Common Wrong Solutions

Reject `commit(&mut self)`, `commit(&self)` with interior mutability,
`Result<TransferReceipt, _>` from commit, checked arithmetic or account lookups
inside commit, applying the source mutation before a remaining fallible
destination step, and rollback logic added to compensate for a fallible commit.

## Arc Continuity

The borrow-bound preparation from lesson 100 is unchanged; commit is added on
top of it, so the exclusive borrow now ends by being consumed rather than
dropped. The dead-code report from the previous lesson disappears here because
every stored field is read by commit.

## Review Checklist

Confirm the starter keeps the lesson 100 solution verbatim and adds only the
commit TODO, commit takes `self` and returns `TransferReceipt`, the tests assert
exact post-commit balances plus the receipt values, and both compile-fail
fixtures fail for the documented reason.
