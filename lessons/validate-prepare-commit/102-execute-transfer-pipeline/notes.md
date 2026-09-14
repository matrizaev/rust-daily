# Author Notes

## Concept Boundary

One concept: orchestration that keeps the phases visible. `execute_transfer`
reads as validate, prepare, commit, and the `TransferError` variants keep the
phase where a failure happened. The lesson is not an invitation to build a
service framework: there is no trait, no generic pipeline, and no repository.

## Intended Solution

Add `TransferError` with `Invalid(TransferRequestError)` and
`Rejected(TransferRejection)`, implement `From` for both phase errors so `?`
works without losing the distinction, and write `execute_transfer` as three
statements: `TransferCommand::try_from(request)?`,
`ledger.prepare_transfer(command)?`, and `prepared.commit()`. The commit call
has no `?` because it cannot fail.

## Validation Strategy

The public tests are the arc's final contract: the success path checks exact
balances and the exact receipt, the combined balance is preserved, every
invalid and rejected path compares the whole ledger against a pre-call clone,
and a rejection is followed by a valid transfer to prove the ledger stays
usable. The type-level signature check keeps `commit` consuming and infallible.
The four compile-fail fixtures recreate the architectural contracts in the
final snapshot: commands and prepared capabilities cannot be forged from
outside the module, a live preparation blocks ledger access, and a committed
preparation cannot be replayed.

## Common Wrong Solutions

Reject one giant `execute_transfer` that interleaves checks with mutation while
producing the same output, a `Result` returned from commit, raw IDs or amounts
flowing straight into commit, re-running validation after mutation has begun,
mutate-then-rollback compensation, and `#[allow(dead_code)]` or assertions
standing in for type or phase design.

## Arc Continuity

This lesson is the arc snapshot: `TryFrom<TransferRequest>` still guards the
command, `prepare_transfer` still resolves every state-dependent failure while
holding exclusive authority, and `PreparedTransfer<'_>` is unchanged. Do not
extend the file into events, projections, persistence, or async work; that
boundary belongs to a later arc.

## Review Checklist

Confirm the starter keeps the lesson 101 solution verbatim and adds only the
orchestration TODO, `execute_transfer` performs exactly three steps, the error
type keeps the phase distinction, and all four compile-fail fixtures fail for
the documented reason.
