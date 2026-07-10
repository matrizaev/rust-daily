# Project Snapshot Validation Implementation Plan

Status: implemented v1. Kept as the implementation record for
[PROJECT_SNAPSHOT_VALIDATION_SPEC.md](PROJECT_SNAPSHOT_VALIDATION_SPEC.md).

## 1. Target Outcome

Implement project snapshot validation for a single generated crate:

- the browser still exposes one editable file per lesson;
- the frontend submits every supported lesson file to `/run`;
- the backend validates safe project paths and writes all submitted files;
- Cargo runs the complete snapshot offline in the existing Podman runner;
- the existing 90 lessons still pass;
- `register-user-use-case` is converted from inline modules to multi-file
  snapshots as the first real curriculum canary.

This plan intentionally does not add multi-file editing, learner-controlled
manifests, workspaces, compile-fail mode, database support, macros, or new
dependency sets.

## 2. Implementation Order

The implementation was completed in this order:

1. Backend path model and workspace assembly.
2. Backend tests for accepted and rejected multi-file payloads.
3. Frontend backend-validation payload construction.
4. Source/generation/harness validation for snapshots.
5. Smoke script support for a multi-file request.
6. `register-user-use-case` conversion.
7. Documentation and final validation.

The first four steps were completed before converting the real arc so the
transport was already covered by backend tests, source validation, and the
solution harness.

## 3. Backend Work

### 3.1 Generalize Submitted Paths

Edit `backend/src/model.rs`.

Replace the fixed enum:

```rust
pub enum SubmittedPath {
    LibRs,
    LessonTest,
}
```

with a validated path type:

```rust
pub struct SubmittedPath(String);
```

Required behavior:

- implement `TryFrom<String>` and `TryFrom<&str>`;
- implement `Display`, `AsRef<Path>` or an equivalent accessor, and `as_str`;
- derive or implement `Clone`, `Debug`, `Eq`, `PartialEq`, `Ord`,
  `PartialOrd`, and `Hash`;
- preserve `ValidationError::UnsafePath`,
  `ValidationError::UnsupportedPath`, and
  `ValidationError::DuplicatePath`;
- update `ValidationError::MissingRequiredFile` so it can name static required
  paths such as `src/lib.rs`.

Add explicit constants:

```rust
const REQUIRED_LIB_PATH: &str = "src/lib.rs";
const TESTS_PREFIX: &str = "tests/";
const SRC_PREFIX: &str = "src/";
const FIXTURES_PREFIX: &str = "fixtures/";
const TESTDATA_PREFIX: &str = "testdata/";
```

Path validation must reject:

- empty paths;
- absolute paths;
- `.` or `..` components;
- backslashes;
- NUL bytes;
- trailing slash paths;
- `Cargo.toml`, `Cargo.lock`, `build.rs`, `.cargo/**`, `target/**`,
  `benches/**`, `examples/**`, and `migrations/**`;
- any path outside `src/**/*.rs`, `tests/**/*.rs`, `fixtures/**`, and
  `testdata/**`.

Keep using Rust path parsing for traversal checks, but also reject backslashes
before parsing so Windows-style separators cannot bypass the allowlist.

### 3.2 Store All Validated Files

Edit `backend/src/model.rs`.

Change `ValidatedRunRequest` from fixed fields:

```rust
lib_rs: SubmittedContent,
lesson_test: SubmittedContent,
```

to a stable collection, preferably:

```rust
files: BTreeMap<SubmittedPath, SubmittedContent>
```

Required behavior:

- reject an empty file list;
- reject file count, per-file size, and total-size limit violations;
- reject duplicate paths;
- require `src/lib.rs`;
- require at least one `tests/**/*.rs` file for `backend-cargo-test`;
- preserve `dependency_set()`;
- expose `files()` as an iterator over `(&SubmittedPath, &SubmittedContent)`.

Keep the old two-file payload valid. It is just one specific snapshot:

```text
src/lib.rs
tests/lesson.rs
```

### 3.3 Update Workspace Assembly

Edit `backend/src/workspace.rs`.

Current code writes generated `Cargo.toml` and then two fixed files. Change it
to write every validated file:

```rust
for (path, content) in request.files() {
    write_file(temp_dir.path().join(path.as_str()), content.as_bytes()).await?;
}
```

Safety requirements:

- path joining must use only already validated paths;
- generated `Cargo.toml` must always be written by the backend;
- submitted files must never overwrite generated control files;
- parent directories must be created as they are today.

The Cargo command in `backend/src/runner.rs` should remain `cargo test
--offline`.

### 3.4 Backend Test Matrix

Add or update tests in `backend/src/model.rs`:

- accepts old two-file payload;
- accepts `src/lib.rs`, `src/domain.rs`, `src/application/mod.rs`,
  `tests/domain_contract.rs`;
- accepts `fixtures/users.json` and `testdata/request.json`;
- rejects `Cargo.toml`;
- rejects `Cargo.lock`;
- rejects `build.rs`;
- rejects `.cargo/config.toml`;
- rejects `target/debug/file`;
- rejects `benches/foo.rs`, `examples/foo.rs`, and `migrations/001.sql`;
- rejects `src/../Cargo.toml`;
- rejects `./src/lib.rs`;
- rejects `/workspace/src/lib.rs`;
- rejects `src\\lib.rs`;
- rejects `src/lib.rs/`;
- rejects duplicate `src/lib.rs`;
- rejects missing `src/lib.rs`;
- rejects missing `tests/**/*.rs`;
- rejects too many files;
- rejects per-file and total-size limit violations.

Add or update tests in `backend/src/workspace.rs`:

- writes nested source modules;
- writes multiple integration test files;
- writes fixture/testdata files;
- keeps generated manifest dependency behavior for `std` and `advanced`.

Run after this step:

```bash
make format
make lint
make test
```

## 4. Frontend Work

### 4.1 Widen Backend Request Types

Edit `frontend/src/validation/backendValidation.ts`.

Change:

```ts
path: "src/lib.rs" | "tests/lesson.rs";
```

to:

```ts
path: string;
```

Remove the helpers that concatenate tests:

- `joinTestFiles`;
- `requestTestFiles`;
- `testCodeFromRequest`, unless it is kept only for legacy fallback.

### 4.2 Build Complete Snapshot Payloads

Edit `frontend/src/validation/backendValidation.ts`.

`buildRunRequest` should:

1. read `request.files`, which already comes from `LessonScreen`;
2. include every supported submitted file as its own `{ path, content }`;
3. not collapse tests into `tests/lesson.rs`;
4. preserve `dependencySet`.

The frontend should filter only files that cannot be part of v1 runner input.
The first implementation can include roles `editable`, `readonly`, and `test`
as long as their paths are under the backend allowlist. Do not send author
notes or solution files; generated runtime lessons should not contain those.

If a lesson record still uses validation `testCode` or validation `testFiles`
without matching `files` entries, support that as a backward-compatible
fallback by adding those tests as:

```text
tests/lesson.rs
```

or their declared `testFiles[].path`. The target state is for generated lesson
files to contain the public tests directly.

### 4.3 Keep One Editable File

Review `frontend/src/components/LessonScreen.tsx`.

Do not add file switching for editable files. The current flow already chooses
the single editable file and sends `lesson.files` with that file replaced by
the current draft.

Tighten behavior only if needed:

- derive `editableFile` once per render instead of calling
  `getPrimaryEditableFile` repeatedly;
- ensure stale checking still compares only the editable file;
- ensure reset only resets the editable file;
- ensure readonly file display still works for additional files.

Review `frontend/src/storage/draftStore.ts`.

Draft records already have a `files` map. Confirm that saving and restoring are
keyed by the editable path and remain backward compatible with existing
`src/lib.rs` drafts.

Run after this step:

```bash
cd frontend
npm run build
yes | npx fallow dupes
yes | npx fallow dead-code
yes | npx fallow health
```

## 5. Content Pipeline Work

### 5.1 Strengthen Source Validation

Edit `frontend/scripts/curriculum/validate-source-content.mjs`.

Add source-side equivalents of the backend path rules:

- no empty paths;
- no absolute paths;
- no `.` or `..` components;
- no backslashes;
- no NUL bytes;
- no trailing slashes;
- no duplicate paths across `lesson.files`;
- exactly one editable file;
- supported backend paths for any file that will be submitted to Cargo;
- `src/lib.rs` exists for backend Cargo lessons;
- at least one test file exists for backend Cargo lessons;
- the editable file has a matching solution file at the same relative path
  under `solution/`.

Current code assumes `author.solutionPath/src/lib.rs`. Generalize it to:

```text
<author.solutionPath>/<editable-path>
```

Keep the old `solution/src/lib.rs` layout valid because most current lessons
use `src/lib.rs` as the editable path.

### 5.2 Update Generated Content Behavior

Edit `frontend/scripts/curriculum/generate-frontend-content.mjs`.

Target behavior:

- inline every file listed in `lesson.files`;
- keep test files as files when they are already listed in `lesson.files`;
- avoid duplicating validation `testFiles` when their contents match lesson
  files;
- keep author notes and solution paths out of generated runtime content.

The current generator already deduplicates validation test files when matching
lesson files exist. Preserve that behavior.

### 5.3 Update Reference Checks

Edit `frontend/scripts/curriculum/check-content-refs.mjs`.

Ensure source-to-generated parity checks compare:

- all lesson file paths;
- all file roles;
- all inlined file contents;
- validation test files that remain outside `lesson.files`;
- concept and arc references as today.

Run after this step:

```bash
cd frontend
npm run content:validate-source
npm run content:generate
npm run content:check-refs
npm run content:check
```

## 6. Solution Harness Work

Edit `scripts/test-lesson-solutions.sh`.

Current behavior copies the complete `solution/` directory and then copies
`tests/` into the temporary crate. That works only when the solution directory
contains the full runnable project.

Change the harness to match the product contract:

1. create a temporary crate;
2. copy `starter/.` into the crate;
3. determine the single editable path from `lesson.json`;
4. copy `<solution>/<editable-path>` over the starter editable file;
5. copy `tests/.` into the crate's `tests/` directory, unless tests are already
   included as files by the lesson source layout;
6. run `cargo test --offline`.

This makes the harness prove that the authored solution is a replacement file
inside the full snapshot, not a completely independent project.

Keep compatibility:

- for existing lessons, editable path is still `src/lib.rs`;
- existing `solution/src/lib.rs` still overlays `starter/src/lib.rs`;
- existing `tests/public.rs` still becomes an integration test.

Run after this step:

```bash
scripts/test-lesson-solutions.sh lessons
```

## 7. Smoke Runner Work

Edit `scripts/play_run.py`.

Add a permanent smoke case:

```text
multi-file-pass
```

The request should submit:

```text
src/lib.rs
src/domain.rs
tests/domain_contract.rs
```

Use only `std` dependencies. Keep the case small:

```rust
// src/lib.rs
pub mod domain;

// src/domain.rs
pub fn answer() -> u64 { 42 }

// tests/domain_contract.rs
#[test]
fn answer_is_42() {
    assert_eq!(rust_daily_lesson::domain::answer(), 42);
}
```

Run locally with the backend up:

```bash
make smoke-runner SMOKE_CASE=multi-file-pass
```

After deployment, run the same case with `SMOKE_URL` pointed at production.

## 8. `register-user-use-case` Conversion

Convert only after backend, frontend, content validation, and harness support
multi-file snapshots.

### 8.1 Target File Layout

Use a single generated crate:

```text
starter/src/lib.rs
starter/src/domain.rs
starter/src/application.rs
starter/src/adapters.rs
starter/src/infrastructure.rs
tests/domain_command.rs
tests/use_case.rs
tests/adapter_boundary.rs
tests/inmemory_repository.rs
tests/handler_boundary.rs
solution/<editable-path>
```

`src/lib.rs` should usually be readonly and contain only module declarations
and intentional re-exports:

```rust
pub mod adapters;
pub mod application;
pub mod domain;
pub mod infrastructure;
```

Use fewer test files if that is clearer, but do not concatenate them just to
fit the old runner.

### 8.2 Editable File by Lesson

Recommended editable focus:

| Lesson | Editable file | Readonly context |
| --- | --- | --- |
| 001 domain command | `src/domain.rs` | `src/lib.rs` |
| 002 repository port | `src/application.rs` | `src/domain.rs`, `src/lib.rs` |
| 003 use-case function | `src/application.rs` | previous domain/application baseline |
| 004 adapter DTO | `src/adapters.rs` | domain and application |
| 005 in-memory repo | `src/infrastructure.rs` | domain, application, adapters |
| 006 handler boundary | one of `src/application.rs` or `src/adapters.rs` | all other modules |

Lesson 006 currently asks for both timeout policy and an Actix handler. During
conversion, reduce it to one editable file:

- option A: edit `src/application.rs` to add timeout behavior, and provide the
  Actix handler as readonly adapter code that exercises it;
- option B: edit `src/adapters.rs` to add the thin Actix boundary, and provide
  the timeout helper as readonly application code;
- do not require the learner to modify both files in one lesson.

Choose the option that best preserves the lesson's primary concept. If both
are important enough to require edits, defer one to a future lesson instead of
breaking the one-editable-artifact rule.

### 8.3 Lesson JSON Updates

For each lesson:

- list every starter source file in `files`;
- mark exactly one file as `editable`;
- mark support modules as `readonly`;
- include public tests as `role: "test"` files when they should be sent to the
  runner directly;
- update validation snippets so they target the editable file's content;
- remove assumptions that all code is in `src/lib.rs`;
- keep `dependencySet: "advanced"`;
- keep author solution path compatible with the editable path.

### 8.4 Content Review

For each converted lesson, review:

- scenario names the visible project shape;
- instructions mention the exact editable file or focused module;
- hints do not imply editing readonly files;
- solution code is idiomatic in its module;
- tests check public behavior through crate paths;
- previous lesson behavior remains active in later tests;
- no file contains stale inline-module references.

Run focused checks:

```bash
cd frontend
npm run content:validate-source
npm run content:generate
npm run content:check-refs
npm run content:check

cd ..
scripts/test-lesson-solutions.sh register-user-use-case
```

## 9. Final Validation

Run the full suite:

```bash
make format
make lint
make test

cd frontend
npm run content:validate-source
npm run content:generate
npm run content:check-refs
npm run content:check
npm run build
yes | npx fallow dupes
yes | npx fallow dead-code
yes | npx fallow health

cd ..
scripts/test-lesson-solutions.sh lessons
make smoke-runner SMOKE_CASE=multi-file-pass
```

Manual browser review:

- open the local app;
- complete each `register-user-use-case` lesson from starter to passing
  validation;
- verify only one editor is editable;
- verify readonly files are visible and cannot be edited;
- verify diagnostics name non-`src/lib.rs` files when a deliberate compile
  error is introduced;
- reset a draft and confirm only the editable file resets.

After deployment:

```bash
make smoke-runner SMOKE_URL=https://borrowquest.qzz.io SMOKE_CASE=multi-file-pass
```

## 10. Checkpoints

Use these checkpoints to keep the change reviewable:

| Checkpoint | Mergeable state |
| --- | --- |
| Backend generalization | Backend accepts old and new payloads; backend tests pass |
| Frontend snapshot payloads | Existing 90 lessons still validate through old two-file shape |
| Content/harness updates | Source checks and solution harness pass for all current lessons |
| Smoke case | Local `/run` proves a nested multi-file crate passes |
| Arc conversion | `register-user-use-case` is multi-file and manually reviewed |

If a checkpoint fails, fix it before continuing. Do not start the arc
conversion while backend/frontend transport is still unstable.

## 11. Likely Code Review Hot Spots

- Path validation must be duplicated intentionally in source tooling and
  backend safety checks; frontend checks are not a security boundary.
- The backend must not accept `Cargo.toml` in v1.
- The old two-file request must keep working.
- Tests must prove duplicate paths are rejected before workspace writing.
- The solution harness must overlay only the editable file, not replace the
  whole project with `solution/`.
- Lesson 006 must not quietly become a multi-file editing task.
- Generated content must not ship author notes or full solution files.

## 12. Follow-Up Work After This Feature

Once this feature is complete, the next infrastructure candidates are:

- compile-fail lesson mode;
- external integration-test crate layouts;
- `advanced-db` with SQLite;
- multi-crate workspaces;
- procedural macro support;
- benchmark runner mode.

Do not begin those until lessons 91-150 have a concrete arc plan that needs
the capability.
