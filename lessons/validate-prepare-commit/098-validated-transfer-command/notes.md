# Author Notes

## Concept Boundary

One concept: a raw request and a validated command are different types because
they carry different guarantees. `TransferCommand` records that the
request-only rules (no self-transfer, no zero amount) already passed. This
lesson is not about `Result`, `TryFrom`, or `NonZeroU64` in isolation; those are
established tools being composed into a validated boundary.

## Intended Solution

Keep `TransferRequest` as the shape the caller supplied and add a private
`TransferAmount(NonZeroU64)` plus a `TransferCommand` whose `source`,
`destination`, and `amount` fields stay private. `TryFrom<TransferRequest>` is
the single construction path: it rejects a self-transfer, then rejects a zero
amount through `NonZeroU64::new`, and only then builds the command. Getters
expose the validated values as `AccountId` and `Money`, never the internal
`TransferAmount`.

## Validation Strategy

Public tests prove that a positive distinct-account request converts and that
both request-only failures return their exact typed error. The `tuple_struct_fields`
and `struct_fields` checks protect the stable shape: the amount stays a
non-zero newtype and the command keeps its three private fields. The compile-fail
fixture proves external callers cannot bypass validation with a struct literal.
Cargo tests remain authoritative for behavior; the checks never assert on local
names or on the order of the checks inside `try_from`.

## Common Wrong Solutions

Reject storing the amount as a plain `u64` in `TransferCommand`, making the
command fields public, adding a `TransferCommand::new` that accepts unchecked
values, reading ledger state inside `TryFrom`, returning `String` or `&str`
errors instead of `TransferRequestError`, and using `assert!` or `panic!` for
zero or same-account validation.

## Arc Continuity

This is the first lesson of the arc, so the arc starts from the provided ledger
support types: `AccountId`, `Money`, `DuplicateAccount`, `Account`, `Ledger`,
and `TransferRequest`. Every later lesson starts from this authored solution and
keeps `TryFrom<TransferRequest>` as the only way to produce a command.

## Review Checklist

Confirm the scenario and instructions describe the request-only invariants, the
starter contains only the transfer command TODO, the public tests cover the
accept path and both reject paths with exact errors, and hint 3 matches the
authored solution.
