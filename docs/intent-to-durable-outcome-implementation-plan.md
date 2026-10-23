# Implementation Plan: Intent to Durable Outcome

## 1. Purpose

Implement the `intent-to-durable-outcome` arc according to
[`rust-daily-intent-to-durable-outcome-arc-spec.md`](rust-daily-intent-to-durable-outcome-arc-spec.md).
The arc uses one inventory-reservation workflow to teach application
orchestration, pure policy, commit-time authority, atomic SQLite mutation,
semantic failure mapping, and the boundary between durable outcomes and
publication.

The architecture draws on the transaction-coupled publication lessons in
Rustshire's `transaction-publication.md`: gather immutable consequences before
commit when needed; do not reconstruct them by reading mutated state afterward;
preflight complete output acceptance before mutation only when the system's
contract couples those guarantees; and never confuse enqueue acceptance with
client delivery. This arc's HTTP response is explicitly **not** transaction-
coupled. No protocol queue, outbox, or transport implementation is added.

## 2. Schedule and scope decisions

This is the next arc after lesson 102, scheduled at global orders 103–109.
Prerequisite arcs are `dto-conversions`, `boundary-error-mapping`,
`register-user-use-case`, and `validate-prepare-commit`. No separate SQLite
prerequisite arc is required; this arc introduces SQLite migrations and
transaction mechanics with supplied fixtures.

The `advanced-db` dependency set and restricted-runner smoke capability are now
implemented. Lessons 1–3 use existing `advanced`; lessons 4–7 use `advanced-db`
with SQLx `=0.8.6` and features `sqlite`, `runtime-tokio`, `macros`, and
`migrate`. The runner gate evidence is recorded in Section 4. Keep scope within
seven lessons; change count only through an explicit spec revision.

The spec fixes all cross-lesson types, outcomes, schema constraints, seed data,
commit-time availability semantics, and publication assumptions. If repository
conventions conflict, stop and update the spec first; do not resolve differences
implicitly while authoring.

## 3. Shared project contract

Implement the exact contract in spec Section 4. Key decisions to preserve:

- `ReservationCommand` exists only after adapter conversion validates positive
  `ItemId` and non-zero `Quantity`; invalid requests never call the repository.
- `InventoryObservation` is immutable; policy receives shared references and
  returns `ReservationIntent` or `PolicyRejection` without I/O or mutation.
- Intent has item and quantity only; no stock snapshot or version. Commit uses
  current availability. Changed stock that still covers request succeeds;
  missing item or insufficient current stock returns `UnavailableAtCommit`.
- `ReservationRepository` exposes `observe` and `commit` async operations using
  application-owned types. SQLx types, rows, and transactions never leave
  infrastructure.
- SQLite guarded decrement and reservation insert share one transaction. A
  statement failure triggers rollback; only confirmed rollback maps to
  `Database`. A commit/rollback failure with unconfirmed outcome maps to
  `CommitOutcomeUnknown`; never claim unchanged state when outcome is unknown.
- Receipt contains generated reservation ID, item ID, and quantity, obtained
  during the transaction. No database read after commit reconstructs it.
- HTTP response failure after commit does not roll back or automatically retry
  reservation. Client delivery is not guaranteed by database commit.

Use the schema and fixture specified in the arc spec: inventory item `1` starts
with stock `5`; item `2` is absent. Install the rejection trigger only in the
rollback test's isolated database.

## 4. Runner and dependency readiness

Inspect current dependency caching, runner scripts, Docker build, browser
validation, and local lesson-solution harness before changing infrastructure.
Do not expose arbitrary Cargo commands or learner-controlled dependency setup.

`advanced-db` runner gate passed. The backend-controlled manifest is
`docker/dependency-cache/advanced-db/Cargo.toml` with exact SQLx `=0.8.6` and
features `sqlite`, `runtime-tokio`, `macros`, and `migrate`. The runner image
build precompiles the manifest into its offline target cache, and
`make smoke-advanced-runner` successfully exercised SQLx, Tokio, a migration,
an in-memory SQLite database, and enabled foreign keys with no network access.

Runner executions receive a fresh Podman container and workspace tmpfs. Lesson
test setup must open a fresh `sqlite::memory:` database with a one-connection
pool, enable foreign keys through `SqliteConnectOptions`, and run
`sqlx::migrate!("./testdata/migrations")` before repository operations. Migration
files are passed as read-only `testdata/**` files. These in-memory tests prove
transaction atomicity and commit semantics within one process; they do not prove
persistence across process restarts or crash recovery. Backend workspace tests check
nested migration file preservation; frontend source validation enforces one
editable artifact; browser validation metadata and the local authored-solution
harness use the same backend-owned manifest. A temporary local harness test also
passed through `scripts/test-lesson-solutions.sh` with SQLx migration and seed
files. Keep this mechanism outside canonical lesson code unless a lesson
explicitly targets a supported artifact.
Run backend checks and `make smoke-runner` when Podman is available; report
smoke test as not run when unavailable.

## 5. Lesson implementation sequence

Every lesson carries previous authored solutions forward as read-only support.
All compile-time and runtime fixtures needed for the day's edit are supplied.
Task text, tests, hints, and solution must agree with the contract.

| Day | Editable artifact | Work to implement | Required tests |
| --- | --- | --- | --- |
| 1 | `src/domain/policy.rs` | Implement `decide(&ReservationCommand, &InventoryObservation)`; reject item mismatch and requested quantity above observed stock; preserve immutable inputs. | Matching sufficient observation accepted; mismatch and insufficient stock rejected; observation unchanged. |
| 2 | `src/application/reservations.rs` | Implement `reserve(repository, command)` with exact observe → decide → commit order and specified `ReservationError` mapping. | Recording fake verifies calls/order; missing item and policy rejection skip commit; accepted intent commits once; commit outcome/error preserved. |
| 3 | `src/infrastructure/controlled_repository.rs` | Make controlled repository enforce current stock on commit, not trust observed stock or mutate requested quantity. | Configure observed stock 5 and current stock 2: quantity 3 passes policy but commit is unavailable with no mutation. Quantity 3 succeeds when current stock is 4 even if observation differs. |
| 4 | `src/infrastructure/inventory_row.rs` | Convert private `InventoryRow { item_id: i64, available: i64 }` into `InventoryObservation`; reject invalid persisted values as `InvalidStoredData`. | SQLx row decoding and conversion reject missing columns, non-positive item ID, negative stock, and stock above `u32::MAX`; row type stays private to infrastructure. |
| 5 | `src/infrastructure/sqlite_repository.rs` | Implement observation and transactional guarded decrement, reservation insert, generated ID capture, and receipt. | Success decrements exact quantity and inserts one matching row; zero affected rows returns unavailable only after confirmed rollback; other in-transaction failures remain conservatively unknown. |
| 6 | `src/infrastructure/sqlite_repository.rs` | Explicitly confirm rollback for statement and conversion failures; preserve unknown commit outcomes. | Insert trigger failure rolls back stock and maps to `Database`; deferred foreign-key failure at COMMIT maps to `CommitOutcomeUnknown`; no retry. |
| 7 | `src/adapter/reservation_response.rs` | Map `ReservationReceipt` and application errors to response values without database access. Document uncoupled HTTP response semantics and contrast optional transaction-coupled publication. | Receipt mapping uses receipt only; simulated delivery failure leaves committed state in the live in-memory database and does not retry. Learner explains preflight only when queue acceptance is part of mutation correctness. |

Lesson 1 implements policy before application orchestration. Lesson 2 receives
completed policy code and the application port. Lesson 3 implements a
controlled repository with separate observed and current stock. Lessons 4–6
carry the SQLx row adapter, migration, and SQLite repository forward. Lesson 7
adds pure response mapping and tests that a later delivery failure cannot undo
or replay the committed reservation.

## 6. Detailed transaction and publication tests

### Application and policy

Use a recording fake implementing `ReservationRepository`:

- adapter conversion rejects invalid raw request before calling `reserve`;
- `reserve` calls `observe` once before policy and `commit`;
- absent item and policy rejection stop before commit;
- accepted intent reaches commit unchanged and exactly once;
- `UnavailableAtCommit` and each `StorageFailure` variant remain distinguishable.

### Controlled stale-state behavior

Use fixed constructor inputs, not timing-based concurrency tests. Configure the
controlled repository to return an earlier observation with stock `5` while
commit state contains stock `2`; a quantity-`3` intent passes policy but commit
returns unavailable without mutation. Also verify quantity `3` succeeds when
current stock is `4`, even if the observation differed. These tests encode the
chosen current-sufficiency rule and prohibit accidental version/CAS behavior.

### SQLite atomicity and errors

Each test uses a fresh migrated SQLite database or a fully reset fixture. For
the rollback test, install a SQLite trigger that aborts reservation insertion.
Call the public repository operation and assert stock remains `5` and
reservation count remains zero. Do not call private SQL helpers as the behavior
under test.

Use explicit transaction rollback for statement failures before commit. Map
SQLx query/insert failures to `StorageFailure::Database` only after rollback is
confirmed. Map malformed persisted values to `InvalidStoredData`. A deterministic
BEFORE INSERT trigger verifies statement failure and rollback; a deferred
foreign-key trigger forces COMMIT failure and verifies `CommitOutcomeUnknown`.
Do not assert unchanged state when outcome is unknown or automatically retry.

### HTTP response versus transaction-coupled publication

The lesson's actual adapter is pure mapping code plus a controlled simulated
delivery failure; it does not run Actix or use a socket. Assert the receipt is
available without a post-commit read and that a simulated delivery error does
not undo or repeat committed work.

Lesson 7 instructions and hints compare this HTTP path with a system whose
correctness requires bounded egress acceptance before mutation. Require learners
to identify: immutable complete semantic consequences; full encoding and
capacity reservation before commit; one commit; ordered enqueue using a one-shot
receipt; enqueue is not delivery; no rollback/replay after enqueue. Do not
implement that second transport path in this arc.

## 7. Repository workflow

1. Schedule is recorded at orders 103–109 with prerequisite arcs
   `dto-conversions`, `boundary-error-mapping`, `register-user-use-case`, and
   `validate-prepare-commit`.
2. Review canonical type/error/API contract in the spec and record any required
   changes there before editing lessons.
3. `advanced-db` gate passed before lesson 4; rerun it if runner, image, SQLx,
   migration, or isolation behavior changes.
4. Create schema, migrations, repository test fixtures, and read-only support
   modules using the exact contracts above.
5. Author lessons in day order with one editable artifact each. Keep every
   previous solution active as read-only project context.
6. Run each lesson's tests and authored solution immediately; verify cumulative
   starter continuity.
7. Regenerate frontend content from canonical lesson sources; never edit
   generated lesson JSON directly.
8. Review the deployed lesson UI and generated diff for correct editable file,
   readable support files, and aligned task/hints/tests/solution.

## 8. Validation

For lesson changes, run:

```text
scripts/curriculum/validate-source
scripts/curriculum/generate
scripts/curriculum/check-generated
scripts/test-lesson-solutions.sh lessons/intent-to-durable-outcome
scripts/curriculum/author-check
```

For runner, backend, Docker, or dependency-cache changes, run:

```text
make format
make lint
make test
make smoke-runner
```

Run `make smoke-runner` when Podman is available; otherwise report it as not
run. For frontend or runner integration changes affecting frontend code, also
run `cd frontend && npm run build` and `cd frontend && npm run test`, plus the
repository-required Fallow checks. For documentation-only changes, run
`git diff --check`; broader suites are unnecessary unless executable examples
or code behavior changed.

## 9. Completion criteria

The arc is complete only when:

- schedule and prerequisites are recorded and the `advanced-db` gate passes;
- all seven lesson tasks match the spec's fixed type, schema, result, and stale
  stock contracts;
- every lesson has one editable artifact and a passing authored solution;
- invalid request, missing item, policy rejection, unavailable-at-commit,
  storage failure, and unknown commit outcome remain distinct as specified;
- inventory and reservation writes are atomic and rollback test proves no
  partial state;
- receipts are produced without post-commit reads;
- response delivery is clearly outside this HTTP database transaction, while
  the optional preflight/enqueue-receipt architecture is accurately explained;
- generated content, local/browser validation, and database isolation agree.

## 10. Risks and mitigations

- **Runner cache drift:** Keep lessons 1–3 on `advanced`; require `advanced-db`
  and rerun the restricted-runner smoke gate after dependency or image changes.
- **Intent treated as authority:** Enforce guarded decrement against current
  stock and retain deterministic changed-stock tests.
- **False claim that every storage error rolled back:** Distinguish confirmed
  rollback from unknown commit outcome; never assert unchanged state for
  `CommitOutcomeUnknown`.
- **Output path mistaken for transaction:** State this HTTP path is uncoupled;
  distinguish queue acceptance and delivery in Lesson 7.
- **Second architecture overwhelms arc:** Explain bounded-output preflight as a
  conditional design comparison only; do not add protocol, outbox, retry, or
  multi-file editing infrastructure here.
