# Author Notes

## Concept Boundary

One concept: prepared work can *hold* the authority it needs instead of merely
describing it. `PreparedTransfer<'a>` borrows the two accounts exclusively, so
the ledger cannot be read or written again until the preparation is consumed or
dropped. This lesson is not about lifetimes in isolation; the lifetime is the
mechanism that turns a stale-able plan into a capability.

## Intended Solution

Keep every lookup and every checked computation from the previous lesson, then
change the prepared type to `PreparedTransfer<'a>` with `source: &'a mut Account`
and `destination: &'a mut Account`, and change `Ledger::prepare_transfer` to
take `&mut self` and return `PreparedTransfer<'_>`. The provided
`account_pair_mut` helper yields both exclusive references without `unsafe` code
or interior mutability. `Clone` and `Copy` disappear, because a capability that
can be duplicated is not a capability.

## Validation Strategy

The Cargo tests keep lesson 99's behavior: successful preparation leaves both
balances untouched, and each rejection leaves the entire ledger equal to its
pre-call clone; only the fixture setup became `mut`, because preparation now
takes `&mut self`. The compile-fail fixtures carry the architectural contract:
`prepared_blocks_ledger_reborrow` proves the ledger cannot be borrowed while the
preparation is alive, and `prepared_not_copy` proves the capability cannot be
duplicated. The structural check only records that the prepared fields are
mutable account references; it deliberately does not prescribe a lifetime name.

## Common Wrong Solutions

Reject `Rc<RefCell<Account>>`, raw pointers or `unsafe`, storing account IDs
again while claiming stale-state protection, cloning accounts into the prepared
value, adding a second revalidation step before use, deriving `Clone` or `Copy`,
and holding a borrow of the whole ledger when two account references are enough.

## Intermediate Warning

Nothing consumes the prepared capability in this lesson, so the compiler reports
the stored fields as never read. That is accurate for this snapshot: the
consuming `commit` arrives in lesson 101, where every field becomes a read. Do
not silence it with `#[allow(dead_code)]` or by adding an unused getter.

## Arc Continuity

The value-only plan from lesson 99 is replaced, not kept alongside: the
rejections, the checked arithmetic, the command boundary, and the public tests
from the earlier lessons all stay active. The next lesson adds `commit` on this
borrow-bound type, and the final lesson composes the three phases.

## Review Checklist

Confirm the starter keeps the lesson 99 solution verbatim and adds only the
provided helper plus the refactor TODO, `prepare_transfer` returns
`PreparedTransfer<'_>` from `&mut self`, the prepared type derives neither
`Clone` nor `Copy`, and both compile-fail fixtures fail for the documented
reason.
