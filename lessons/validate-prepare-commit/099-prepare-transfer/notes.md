# Author Notes

## Concept Boundary

One concept: fallible work that depends on current state belongs before the
mutation, not inside it. `prepare_transfer` performs every account lookup and
both pieces of checked arithmetic, and returns a rejection instead of a
partially applied transfer. This lesson is not about `Result`, `Option`, or
error enums in isolation; those tools are being arranged around the mutation
boundary.

## Intended Solution

Add private `Money::checked_add` and `Money::checked_sub` helpers, a
`TransferRejection` enum with one variant per state-dependent failure, and a
value-only `PreparedTransfer` that carries the account IDs, the amount, and both
post-transfer balances. `Ledger::prepare_transfer(&self, command)` resolves the
source balance, then the destination balance, then computes `source_after` with
checked subtraction and `destination_after` with checked addition. Every failure
returns before the function could write, and taking `&self` makes that guarantee
visible in the signature.

## Validation Strategy

The public tests check the rejection variants and, just as importantly, compare
the whole ledger against a clone taken before the call: an error that still
moved money fails the lesson. The structural checks protect stable API shape
only: the four rejection variants, the two `Money` post-state fields on
`PreparedTransfer`, and a `prepare_transfer` that takes the command and returns
`Result<PreparedTransfer, TransferRejection>`. Nothing checks local variable
names or the order of the `checked_*` calls; the Cargo tests remain
authoritative.

## Common Wrong Solutions

Reject decrementing the source before the destination overflow check, mutating
and then restoring balances on error, using saturating arithmetic, using
unchecked `+` or `-` for the post-state, taking `&mut self` while still storing
only copied IDs and balances, and adding `commit` early.

## Arc Continuity

`TryFrom<TransferRequest>` remains the only way to obtain a `TransferCommand`,
and its zero-amount and same-account tests stay active in this lesson's suite.
The prepared type introduced here is deliberately value-only: the next lesson
replaces it with a borrow-bound capability, and this lesson's completion text
says so explicitly so the intermediate design is never mistaken for the target
design.

## Review Checklist

Confirm the scenario and instructions describe state-dependent failures,
preparation is described as a calculation rather than a partial transfer, the
starter contains only the preparation TODO, every rejection test compares the
ledger with its pre-call clone, and the completion text labels the value-only
plan as intermediate.
