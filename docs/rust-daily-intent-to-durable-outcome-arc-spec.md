# Rust Daily Arc Specification: Intent to Durable Outcome

- **Status:** implemented; validation passing
- **Repository:** `matrizaev/rust-daily`
- **Placement:** immediately after `validate-prepare-commit` (lesson 102)
- **Global lesson orders:** 103–109
- **Arc ID:** `intent-to-durable-outcome`
- **Target lesson count:** 7
- **Primary pillar:** architecture
- **Dependency sets:** existing `advanced` for lessons 1–3; implemented `advanced-db` for lessons 4–7 (`sqlx = 0.8.6`)

## 1. Purpose

This arc teaches one end-to-end ownership boundary: an external request becomes
a validated command, immutable facts inform a domain decision, an accepted
intent reaches a persistence boundary, and an atomic database transaction
returns a semantic outcome.

The running example is reserving limited catalog inventory. The policy decides
whether the request is acceptable based on an immutable inventory observation.
That decision is a proposal, not authority over current stock. The repository
must enforce current availability as it records the reservation and decrements
inventory in one SQLite transaction.

The recurring case: warehouse has five units of item `1`; fulfillment requests
three. A competing checkout can reduce stock to two between observation and
commit, while a current quantity of four still covers the same request. The
reservation record and stock decrement must commit together. After commit, the
customer connection can still drop before receiving the HTTP response.

The architecture is informed by transaction-coupled publication design:
prepare all consequences that matter before crossing an authoritative commit
boundary; carry immutable semantic facts forward instead of reconstructing them
from mutated state; distinguish enqueue acceptance from client delivery; and do
not roll back or replay committed work because a later output step fails. This
arc teaches when those principles apply, but does not implement a protocol
queue, bounded egress reservation, outbox, or network delivery system. The
reservation example uses ordinary request/response HTTP semantics, where a
successful database commit remains successful even if response encoding or
delivery later fails.

## 2. Placement and prerequisites

This arc follows `validate-prepare-commit` immediately. Its prerequisite arc
IDs are `dto-conversions`, `boundary-error-mapping`,
`register-user-use-case`, and `validate-prepare-commit`; these provide command
conversion, boundary error mapping, async application ports, and the earlier
in-memory commit boundary.

No prior SQLite or SQLx arc is required. Lessons 4–6 introduce database row
conversion, SQLite migration use, and transaction ownership using supplied
schema, seed data, tests, and the `advanced-db` dependency set. Learners must
already be able to read Rust enums, structs, traits, `Result`, `?`, and async
functions. The arc occupies global lesson orders 103–109.

Repository alignment:

- Reuse vocabulary and boundaries from `dto-conversions`,
  `boundary-error-mapping`, and `register-user-use-case`.
- Treat `validate-prepare-commit` (lessons 98–102) as prerequisite. Its
  in-memory capability and this arc's database transaction are related commit
  boundaries, not the same mechanism.
- Keep exactly one editable artifact per lesson. Other modules, SQL migrations,
  fixtures, adapters, and tests are supplied read-only.
- Keep domain APIs free of SQLx, HTTP framework types, rows, and transaction
  handles. Application owns repository ports; infrastructure implements them.

## 3. Learning outcomes

By the end of the arc, learners can:

1. Convert and reject malformed requests before application storage calls.
2. Coordinate observation, pure policy, and commit in an application service
   through a narrow, application-owned async port.
3. Give policy immutable, domain-shaped facts and have it return an intent or
   rejection without storage access or mutation.
4. Explain that an intent is a proposal and specify exactly which current-state
   changes make commit unavailable.
5. Keep database rows, SQLx errors, and transaction handles inside
   infrastructure while preserving semantic outcomes across the port.
6. Make inventory decrement and reservation insertion atomic, including
   rollback when the second write fails.
7. Return immutable semantic facts sufficient for response mapping without a
   post-commit database read.
8. Distinguish durable commit, bounded-queue enqueue acceptance, and client
   delivery; know when output acceptance must be preflighted before mutation.
9. Test policy, orchestration, stale observations, transaction rollback, and
   post-commit response failure at their narrowest useful boundaries.

## 4. Fixed domain and repository contracts

Names and observable meanings in this section are normative for lesson tasks,
fixtures, hints, and tests. Internal module layout may vary.

### Domain values and policy

- `ItemId` wraps private `NonZeroI64`; `ItemId::new(i64) -> Option<ItemId>`
  validates it and `value(self) -> i64` exposes its SQLite-compatible positive
  value.
- `Quantity` wraps private `NonZeroU32`; `Quantity::new(u32) -> Option<Quantity>`
  validates it and `value(self) -> u32` exposes its positive value.
- `ReservationRequest` has public raw `item_id: i64` and `quantity: u32`
  fields.
- `ReservationRequestError` has exactly `InvalidItemId` and `ZeroQuantity`
  variants. `TryFrom<ReservationRequest> for ReservationCommand` uses
  `ReservationRequestError` as its error type; it checks item ID first, then
  quantity, returning `InvalidItemId` for non-positive IDs and `ZeroQuantity`
  for zero quantity. Conversion occurs before the use case and every repository
  call.
- `ReservationCommand` has private `item_id` and `quantity` fields and
  copy-returning `item_id()` and `quantity()` getters.
- `InventoryObservation` has private `item_id: ItemId` and `available: u32`
  fields; `new(ItemId, u32) -> InventoryObservation` creates one, and
  `item_id(&self) -> ItemId` and `available(&self) -> u32` expose copy values.
  Zero availability is valid.
- Infrastructure `InventoryRow` is private and derives `sqlx::FromRow`; its
  raw `i64` `item_id` and `available` fields convert through
  `TryFrom<InventoryRow> for InventoryObservation`. `decode_inventory_row`
  maps SQLx row-decoding errors and invalid stored values to
  `StorageFailure::InvalidStoredData`.
- `ReservationIntent` has private `item_id` and `quantity` fields;
  `item_id(&self) -> ItemId` and `quantity(&self) -> Quantity` expose copy values.
  It carries no observed stock value or version and is not a capability.
- `decide(&ReservationCommand, &InventoryObservation) ->
  Result<ReservationIntent, PolicyRejection>` is synchronous. Compare item IDs
  first and return `ObservationMismatch` when they differ; otherwise return
  `InsufficientObservedInventory` when requested quantity exceeds observed
  availability; otherwise return an intent from the command's item and quantity.
  `PolicyRejection` has exactly `ObservationMismatch` and
  `InsufficientObservedInventory` variants. Policy never mutates either input.

The intent deliberately contains no snapshot version. A change in stock does
not itself invalidate the intent: commit succeeds if the item still exists and
current stock is at least the requested quantity. Commit returns
`UnavailableAtCommit` if the item disappeared or current stock is now too low.
This is the arc's chosen rule; do not add compare-and-swap versioning or reject
all stock changes.

### Application port and outcomes

The application-owned `ReservationRepository: Send + Sync` port has two
operations:

```rust
pub trait ReservationRepository: Send + Sync {
    fn observe(
        &self,
        item_id: ItemId,
    ) -> impl std::future::Future<
        Output = Result<Option<InventoryObservation>, StorageFailure>,
    > + Send;

    fn commit(
        &self,
        intent: ReservationIntent,
    ) -> impl std::future::Future<Output = Result<CommitOutcome, StorageFailure>> + Send;
}
```

`None` from `observe` means item not found. `StorageFailure` is an
application-owned error with exactly `Database`, `InvalidStoredData`, and
`CommitOutcomeUnknown` variants; it contains no SQLx type or database row.
`Database` means a database operation failed and rollback (if a transaction
had started) is confirmed. `InvalidStoredData` means SQL row decoding or checked
conversion of persisted values failed. `CommitOutcomeUnknown` means commit or
rollback failed and the transaction outcome cannot be established; callers must
not assume it committed or rolled back. `CommitOutcome` is
`Committed(ReservationReceipt)` or `UnavailableAtCommit`.

`ReservationId::new(i64) -> Option<ReservationId>` validates a positive SQLite
row ID; `value(self) -> i64` exposes it. `ReservationReceipt::new` accepts
validated values; its fields are private and its
copy-returning getters are `reservation_id(&self) -> ReservationId`,
`item_id(&self) -> ItemId`, and `quantity(&self) -> Quantity`. The SQLite
repository constructs it only from values already known inside its transaction,
not from a query after commit. A receipt describes a committed result; it is not
an authority to repeat commit. `InventoryRow` conversion returns
`InvalidStoredData` for a non-positive ID, negative stock, or stock above
`u32::MAX`.

The application function has this signature; its behavior is specified below:

```text
pub async fn reserve(
    repository: &impl ReservationRepository,
    command: ReservationCommand,
) -> Result<ReservationReceipt, ReservationError>
```

`ReservationError` has exactly `ItemNotFound`,
`PolicyRejected(PolicyRejection)`, `UnavailableAtCommit`, and
`Storage(StorageFailure)` variants. `reserve` follows this exact behavior:

1. Observe the requested item. A missing item returns `ItemNotFound`; no policy
   decision or commit call follows.
2. Run policy against the observation. A rejection returns
   `PolicyRejected(PolicyRejection)`; commit is not called.
3. Pass the accepted intent to `commit` exactly once.
4. Return the receipt on `Committed`, `UnavailableAtCommit` on that outcome,
   and map `StorageFailure` to `Storage` without erasing policy or availability
   outcomes.

Invalid requests never enter `reserve`; the adapter maps
`ReservationRequestError` to its invalid-request response. If a client retries
a request after losing the response, this arc does not deduplicate it; a second
successful request may create a second reservation.

### SQLite schema and transaction

The supplied migration creates:

```sql
CREATE TABLE inventory (
    item_id INTEGER NOT NULL PRIMARY KEY CHECK (item_id > 0),
    available INTEGER NOT NULL CHECK (available >= 0)
);

CREATE TABLE reservations (
    reservation_id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL REFERENCES inventory(item_id) DEFERRABLE INITIALLY DEFERRED,
    quantity INTEGER NOT NULL CHECK (quantity > 0)
);
```

Every isolated test database is migrated and seeded with item `1` at stock
`5`; item `2` is absent. Tests may use a fresh database per case or reset this
fixture between cases, but cases must not share mutations. No test uses external
services or network access. The in-memory fixture demonstrates transaction atomicity and commit semantics
only; it does not demonstrate persistence across process restarts or crash
recovery.

`commit(intent)` opens one SQLite transaction and executes this guarded update
before inserting the reservation:

```sql
UPDATE inventory
SET available = available - ?
WHERE item_id = ? AND available >= ?;
```

If affected-row count is zero, roll back the read/write transaction and return
`UnavailableAtCommit` without inserting a reservation. If rollback cannot be
confirmed, return `Storage(CommitOutcomeUnknown)`. If affected-row count is one,
insert exactly one reservation row in the same transaction, capture its
generated ID, and commit. A statement failure before commit must be followed by
rollback; no read after commit is allowed to reconstruct the receipt.

A failure returned by a statement before commit maps to `Storage(Database)`
only after rollback is confirmed. Invalid values read from a row map to
`Storage(InvalidStoredData)`. A failed commit or rollback maps to
`Storage(CommitOutcomeUnknown)` when transaction outcome cannot be established;
do not claim that no mutation occurred. The arc adds no retry or idempotency
scheme.

## 5. Ownership and publication contract

- **Adapter:** Owns `ReservationRequest` and response representations; validates
  the request into `ReservationCommand` and maps semantic results to a
  response.
- **Application:** Owns orchestration and repository port; passes domain values
  and returns semantic outcomes.
- **Domain:** Owns validated values, immutable observations, policy decisions,
  intents, and policy rejections. It has no persistence or protocol dependency.
- **Persistence adapter:** Owns SQLx, row conversion, transaction mechanics,
  and mapping storage failures to `StorageFailure`.
- **Database transaction:** Owns atomicity of inventory decrement and
  reservation insertion. No transaction handle crosses into domain or
  application APIs.

For this HTTP request/response example, the database commit is not coupled to
response delivery. The receipt is sufficient to construct the response without
re-reading mutable database state. If response mapping or delivery fails after
commit, the database commit is not undone; the server does not automatically
repeat the reservation. Persistence across restart depends on database
configuration and is not established by the in-memory lesson tests. If a
connection fails before the client receives a response, it may not know whether
the reservation committed. A client retry may create another reservation
because idempotency is out of scope.

The architectural contrast from transaction-coupled publication is explicit:
when a system's correctness contract requires a complete output batch to be
accepted by a bounded egress queue together with a state change, prepare all
immutable semantic consequences, encode the complete batch, and reserve its
full capacity before commit. Then commit once and carry a one-shot enqueue
receipt with the exact semantic output at its ordered rendering position.
Enqueue acceptance is not client delivery; post-enqueue transport failure does
not roll back or automatically replay committed work. That design is a
conditional architecture choice, not a rule for this HTTP reservation path.
This arc teaches the decision and boundary; it does not implement egress
reservations, protocol frames, output receipts, or an outbox.

## 6. Lesson sequence

Seven lessons, one primary concept and one focused 8–10-minute edit each.
Sequence is cumulative; completed solutions become read-only context. The policy lesson
comes first so orchestration does not depend on a concept the learner has not
yet implemented.

| Day | Title | Editable artifact | Required observable result |
| --- | --- | --- | --- |
| 1 | Decide from immutable inventory facts | `src/domain/policy.rs` | Pure decision; mismatch and insufficient-observation rejections; inputs unchanged. |
| 2 | Orchestrate a reservation use case | `src/application/reservations.rs` | Observe → decide → commit order; missing item and policy rejection skip commit; accepted intent commits once. |
| 3 | Recheck availability at commit | `src/infrastructure/controlled_repository.rs` | A configured stale observation does not authorize a commit when current stock is too low; sufficient current stock still permits commit. |
| 4 | Decode persisted inventory safely | `src/infrastructure/inventory_row.rs` | Convert a private `InventoryRow` into `InventoryObservation`; invalid stored values become `InvalidStoredData`; no SQLx type leaves infrastructure. |
| 5 | Commit reservation with SQLite | `src/infrastructure/sqlite_repository.rs` | Guarded decrement and reservation insert share one transaction; insufficient current stock returns unavailable; transaction-time uncertainty remains conservative. |
| 6 | Classify transaction failures | `src/infrastructure/sqlite_repository.rs` | Explicitly confirm rollback before mapping statement failure to `Database`; commit or rollback failure maps to `CommitOutcomeUnknown`. |
| 7 | Map the response after commit | `src/adapter/reservation_response.rs` | Map receipt without another database read; simulated response failure leaves committed state in the live in-memory database; explain when queue acceptance would require preflight. |

Lesson 2 has the completed Lesson 1 policy and a supplied application port.
Lesson 3 completes a deterministic controlled repository; keep it read-only in
later snapshots. Lessons 4–6 carry one SQLite schema and repository forward.
Lesson 7 uses a pure response mapper and a simulated post-commit delivery
failure; it does not start a network server or claim to test client receipt.
The in-memory tests demonstrate committed state surviving a later response
failure within the same database lifetime, not persistence across process
restarts. Lesson 7's task and hints include the bounded-egress preflight
comparison required by the arc outcomes.

## 7. Validation and acceptance criteria

The completed arc demonstrates all of the following:

1. Invalid raw requests fail conversion before any repository call.
2. Policy accepts only matching observations with sufficient observed stock;
   it mutates neither input.
3. Missing item and policy rejection never call commit.
4. An accepted intent commits exactly once.
5. A stock change that leaves sufficient current stock still commits; a missing
   item or insufficient current stock returns `UnavailableAtCommit` without a
   reservation row or partial decrement.
6. Successful commit decrements stock by requested quantity and creates exactly
   one reservation with the requested item and quantity.
7. A deterministic insert failure after the decrement attempt rolls back the
   decrement and leaves reservation count unchanged.
8. Row/domain conversion errors, database errors, and unknown commit outcomes
   map to the specified storage variants; raw SQLx and row types stay inside
   infrastructure.
9. The receipt is created from in-transaction facts and response mapping
   performs no post-commit database read.
10. Simulated response delivery failure after commit does not claim rollback,
    retry, or client delivery.
11. Learner can explain the distinct optional pattern for systems that must
    preflight complete bounded output acceptance before mutation.
12. Each lesson has one editable artifact, deterministic validation, a passing
    authored solution, and cumulative continuity.

Use pure unit tests for policy, a recording fake port for orchestration,
controlled repository state for stale observations, and isolated SQLite tests
for persistence. Database behavior must be tested through repository public
contracts, not private SQL helpers. The rollback test installs a deterministic
trigger in its test database that rejects reservation insertion after the
inventory update; assert both stock and reservation count after failure.

## 8. Runner and infrastructure gate

Lessons 1–3 use the existing `advanced` dependency set. Lessons 4–7 use the
implemented `advanced-db` set, which extends `advanced` with exact SQLx version
`0.8.6` and features `sqlite`, `runtime-tokio`, `macros`, and `migrate`. Its
backend-owned manifest is `docker/dependency-cache/advanced-db/Cargo.toml`; the
runner image compiles those dependencies into its offline target cache. Runs
use a new Podman container and workspace tmpfs. Test setup creates an isolated
SQLite in-memory database with a one-connection pool, explicitly enables
foreign keys, then runs `sqlx::migrate!("./testdata/migrations")` before
repository operations. Migration files travel as read-only `testdata/**`
project files.

The dependency-set and migration smoke gate passes with
`make smoke-advanced-runner`. It exercises SQLx SQLite, Tokio, the migration
macro, an in-memory database, and foreign-key enforcement offline in the
restricted runner. Backend workspace tests verify nested migration files are
preserved; the source validator enforces exactly one editable artifact; the
local solution harness reuses the same backend-owned manifest. Re-run this gate
if the manifest, image, runner, migration path, or database isolation changes.

## 9. Non-goals

This arc does not implement or teach:

- a general unit-of-work, transaction, policy, or prepared-operation framework;
- event sourcing, outbox, message broker, distributed transaction, saga, or
  exactly-once delivery;
- retry policy or idempotency keys;
- protocol frame encoding, recipient routing, bounded egress reservations,
  enqueue receipts, or network delivery;
- a full Actix endpoint or production inventory service;
- a generic persistence abstraction beyond the repository port used here;
- cache design, benchmarking, typed configuration, or unrelated clock/random
  seams;
- multi-file editing or changes to Rust Daily's one-editable-artifact rule.

Do not present one architecture as mandatory in every Rust application. Explain
why this reservation path uses an uncoupled HTTP response and when a different
system would make output acceptance part of its authoritative transaction.

## 10. Authoring quality gates

- Keep task text, starter, hints, tests, and solution aligned with contracts in
  Section 4.
- Preserve the chosen stock-change rule: current sufficiency, not snapshot
  version equality, decides commit availability.
- Keep one reservation workflow through all lessons and reuse its domain types.
- Do not reread mutable persistence state after commit to rebuild receipt or
  response facts.
- Explain database atomicity, output acceptance, and client delivery as
  separate guarantees.
- Complete all lessons in the deployed UI and run source validation,
  generation, generated-content checks, and affected lesson-solution tests
  before merge.
