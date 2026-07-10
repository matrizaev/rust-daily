# Project Snapshot Validation Feature Spec

Status: implemented v1 runner capability. The implementation checklist is
maintained in
[PROJECT_SNAPSHOT_VALIDATION_IMPLEMENTATION_PLAN.md](PROJECT_SNAPSHOT_VALIDATION_IMPLEMENTATION_PLAN.md).

## 1. Summary

Rust Daily should validate a lesson as a complete authored project snapshot
while still exposing exactly one editable artifact to the learner.

The backend runner originally accepted only:

```text
src/lib.rs
tests/lesson.rs
```

The frontend therefore collapses every lesson into one library file and one
combined test file before calling `/run`. That keeps the system simple, but it
blocks realistic advanced lessons. Ownership, API design, async boundaries,
Actix adapters, persistence, macro work, and capstones often need supporting
modules, fixtures, and integration tests to be clear and idiomatic.

This feature generalizes validation transport and workspace assembly from "one
source file plus one test file" to "one editable file inside a read-only project
snapshot." It does not turn the product into a multi-file editor.

## 2. Problem

The first 90 lessons proved that narrow single-file tasks work well for focused
daily practice. They also exposed a constraint:

- advanced code becomes artificial when all context must fit in `src/lib.rs`;
- tasks can drift from starters when continuity is simulated instead of
  represented as real project files;
- public tests lose useful shape when multiple test files are concatenated;
- future lessons cannot naturally teach module boundaries, integration tests,
  adapters, fixtures, or larger refactors.

The road to 500 lessons needs realistic project shape without increasing the
learner's daily edit surface.

## 3. Goals

- Validate all supplied files for a lesson project snapshot.
- Keep exactly one editable artifact per lesson.
- Preserve the current 5-10 minute lesson constraint.
- Preserve the current deterministic validation model: browser structural
  checks plus Cargo-backed tests in the isolated runner.
- Preserve current lessons and the existing `/run` payload shape where
  practical.
- Let readonly support files participate in compilation and tests.
- Let a later lesson make a different file editable while previous authored
  solutions become readonly project code.
- Convert the existing `register-user-use-case` arc to the project snapshot
  model as the first real curriculum canary.
- Keep dependency sets explicit and cached in the runner image.
- Keep path handling strict enough that untrusted payloads cannot write outside
  the temporary workspace or override runner-controlled files.
- Produce compiler and test diagnostics that still name useful file paths.

## 4. Non-Goals

- No multi-file learner editing.
- No browser IDE project explorer with arbitrary file creation, rename, or
  deletion.
- No learner-controlled `Cargo.toml` in the first implementation.
- No arbitrary Cargo commands.
- No hidden server-owned tests or tamper-resistant certification.
- No network access from the runner.
- No external databases or services.
- No multi-crate workspaces in the first implementation.
- No procedural macro crate support in the first implementation.
- No compile-fail mode in the first implementation.
- No automatic static analysis proving that lesson instructions reference
  existing code. The source validator should catch mechanical mismatches, but
  task clarity remains part of author review.

## 5. Product Contract

Every lesson has exactly one file with role `editable`.

All other files are supplied as readonly project context:

- Rust source modules;
- integration tests;
- fixtures or test data;
- eventually manifests, migrations, and other text artifacts after their
  runner modes are designed.

During a lesson:

1. The learner edits only the editable file.
2. The frontend builds a validation snapshot by replacing that file's starter
   content with the learner's draft.
3. The frontend sends every runnable project file to the backend.
4. The backend materializes the snapshot in a temporary Cargo workspace.
5. The runner executes deterministic Cargo validation offline.

Across an arc:

1. Lesson N has one editable file.
2. Lesson N + 1 starts from the authored reference solution of lesson N.
3. The previous file may become readonly context.
4. The learner's exact previous submission is not carried forward.

This keeps continuity authored and deterministic while allowing each day to
remain small.

## 6. First Implementation Scope

The first implementation should support a single generated library crate with
multiple submitted files.

The first real lesson conversion target is the existing
`register-user-use-case` arc. It already represents `domain`, `application`,
`adapters`, and `infrastructure` as inline modules inside `src/lib.rs`; moving
those boundaries into separate files should make the lesson code more idiomatic
without expanding the learner's editable surface.

### 6.1 Supported Files

Accepted paths:

```text
src/**/*.rs
tests/**/*.rs
fixtures/**
testdata/**
```

Required paths:

```text
src/lib.rs
```

At least one `tests/**/*.rs` file should be present for `backend-cargo-test`
validation. A future compile-only mode can relax that separately.

Rejected paths in v1:

```text
Cargo.toml
Cargo.lock
build.rs
.cargo/**
target/**
benches/**
examples/**
migrations/**
```

The backend continues to generate `Cargo.toml` from the selected dependency
set. This preserves offline dependency control and prevents a submitted lesson
from changing the dependency graph.

### 6.2 Path Rules

All submitted paths must be normalized relative Unix paths.

Reject:

- empty paths;
- absolute paths;
- paths containing `..`;
- paths containing `.` as a component;
- duplicate paths;
- trailing slash paths;
- paths containing backslashes;
- paths containing NUL bytes;
- paths outside the v1 allowlist;
- paths that would collide with runner-controlled files.

The backend should validate paths before creating directories or writing any
file. The workspace builder should join validated paths only after validation.

### 6.3 Content Limits

Keep existing request and file limits unless multi-file lessons need a modest
increase after measurement:

| Limit | Current value |
| --- | ---: |
| JSON request | 300,000 bytes |
| Individual file | 65,536 bytes |
| Submitted files total | 262,144 bytes |
| Execution timeout | 10 seconds |
| Combined output | 65,536 bytes |

If limits change, update `docs/SPEC.md`, backend config defaults, deployment
config, and any tests that assert them.

## 7. Lesson Authoring Contract

The canonical lesson source remains under:

```text
lessons/<arc>/<lesson>/
  lesson.json
  notes.md
  starter/
  tests/
  solution/
```

For a project snapshot lesson:

- `starter/` contains the editable starter file and all readonly source files.
- `tests/` contains public Cargo tests.
- `solution/` contains the authored replacement for the editable file.
- The generated runtime lesson includes all starter and test files needed for
  browser display and validation.
- Author notes and full solution directories are never shipped as normal
  runtime content.

The source validator must enforce:

- exactly one editable file;
- path uniqueness across all file roles;
- safe relative paths using the same rules as the backend where applicable;
- all referenced source files exist;
- the editable path exists in `starter/`;
- the editable path has a matching authored solution;
- readonly and test files do not point into `solution/`;
- generated lesson files match canonical source files;
- current two-file lessons remain valid.

The solution harness should validate a lesson by replacing only the editable
starter file with the authored solution and compiling the complete snapshot.

## 8. Frontend Requirements

### 8.1 Editor Behavior

The UI continues to expose one editable file. Existing readonly-file display is
the right model; it may be improved, but no multi-edit workflow should be
introduced.

Draft behavior:

- drafts are keyed by lesson and editable path;
- resetting a lesson resets only the editable file;
- readonly files always come from lesson content;
- changing the editable path in a future lesson should not load a stale draft
  for another path.

### 8.2 Validation Request Construction

The backend Cargo adapter should build a complete runnable snapshot:

1. Start from all generated lesson files.
2. Replace the editable file content with the current editor draft.
3. Include every supported readonly source file.
4. Include every public test file as its own file.
5. Do not concatenate test files.
6. Do not send author notes or solution files.
7. Do not send unsupported display-only files to the backend.

The request can keep the existing shape:

```json
{
  "dependencySet": "advanced",
  "files": [
    { "path": "src/lib.rs", "content": "..." },
    { "path": "src/domain.rs", "content": "..." },
    { "path": "tests/domain_contract.rs", "content": "..." }
  ]
}
```

Frontend TypeScript should stop typing backend file paths as only
`"src/lib.rs" | "tests/lesson.rs"`.

### 8.3 Structural Checks

Structural checks should keep targeting the editable file by default.

If a future check needs to inspect a readonly file, that should be explicit in
the validation step, not accidental through a global source string. Browser
checks remain fast guidance and do not replace Cargo validation.

## 9. Backend Requirements

### 9.1 Model

Replace the fixed `SubmittedPath` enum with a validated path type that can
represent all accepted v1 paths.

`ValidatedRunRequest` should store an ordered collection of validated files,
for example a `BTreeMap<SubmittedPath, SubmittedContent>` or a `Vec` after
duplicate checking. Stable ordering is useful for tests and reproducibility.

Validation must check:

- non-empty file list;
- max file count;
- max file bytes;
- max total bytes;
- duplicate paths;
- required `src/lib.rs`;
- at least one test file for cargo-test mode;
- v1 path allowlist;
- dependency set validity.

### 9.2 Workspace Assembly

The workspace builder should:

1. Create the temporary workspace under the configured workspace root.
2. Generate `Cargo.toml` from the dependency set.
3. Write every validated submitted file.
4. Create parent directories as needed.
5. Never allow submitted files to overwrite generated `Cargo.toml`, runner
   scripts, target cache directories, or other control files.

The Cargo invocation can remain `cargo test --offline` for v1.

### 9.3 Diagnostics

Compiler messages should preserve file paths from Cargo JSON output.

The frontend should continue filtering Cargo bookkeeping messages such as
`compiler-artifact`. When a compile error originates in a readonly file because
of the learner's API change, the rendered diagnostics should still show the
readonly path and the relevant call site.

No perfect editor-level diagnostic mapping is required in v1.

## 10. Security and Isolation

The runner remains the trust boundary. This feature increases the number of
files written into a workspace, so path validation becomes more important.

Security requirements:

- no submitted path may escape the temporary workspace;
- no submitted path may override generated control files;
- no network access is added;
- dependency sets remain backend-controlled;
- request and output limits remain enforced;
- workspaces are still removed after normal execution;
- readonly files are readonly only in the product model, not in the container;
  this is acceptable because every run uses a fresh submitted snapshot.

Do not rely on frontend validation for safety. The backend must reject unsafe
payloads independently.

## 11. Compatibility

Existing lessons should continue to work without source migrations.

The frontend may normalize older generated lesson records as:

```text
starterCode -> files[{ path: "src/lib.rs", role: "editable" }]
testCode/testFiles -> tests/**/*.rs
```

The backend should continue accepting the old two-file request because it is a
valid subset of the new request model.

No deployment schema migration is required because progress and drafts are
local browser data. Draft path handling should remain backward compatible for
existing `src/lib.rs` drafts.

## 12. Implementation Plan

### Phase 1: Backend Path Generalization

- Introduce a validated submitted path type.
- Add v1 allowlist and required-file validation.
- Store submitted files in a stable collection.
- Update workspace assembly to write all validated files.
- Add backend tests for allowed paths, rejected paths, duplicates, limits,
  missing `src/lib.rs`, missing tests, and nested directories.

### Phase 2: Frontend Snapshot Submission

- Update backend request types to accept arbitrary validated path strings.
- Build backend payloads from all lesson files instead of collapsing tests.
- Replace only the editable file with the learner draft.
- Keep structural checks scoped to the editable file.
- Add focused tests or script coverage for request construction if a frontend
  test harness exists; otherwise rely on build and content validation until a
  test harness is added.

### Phase 3: Content and Harness Validation

- Strengthen source validation for path uniqueness and editable solution
  coverage.
- Update generated-content parity checks for multi-file snapshots.
- Update `scripts/test-lesson-solutions.sh` if needed so authored solutions are
  tested as replacement files inside the full snapshot.
- Add at least one small multi-file fixture or canary lesson in validation
  tests before authoring real lesson 91 content.

### Phase 4: Manual and Deployed Smoke

- Run all current lesson solutions.
- Run backend unit tests, lint, and format.
- Run frontend content checks and production build.
- Smoke-test `/run` with a multi-file payload against a local backend.
- After deployment, smoke-test the live backend with the same payload.

### Phase 5: Convert `register-user-use-case`

- Split the arc's inline modules into a realistic single-crate layout, for
  example `src/domain.rs`, `src/application.rs`, `src/adapters.rs`, and
  `src/infrastructure.rs`.
- Keep exactly one editable file per lesson.
- Keep previous lesson reference solutions as readonly files in later lessons.
- Move public tests into one or more real `tests/**/*.rs` files instead of a
  concatenated `tests/lesson.rs` when doing so improves clarity.
- Preserve the existing learning objectives: domain command, repository port,
  use-case function, adapter DTO, in-memory repository, timeout policy, and
  Actix handler boundary.
- Re-review every task, hint, validation snippet, and reference solution after
  the split so no instruction names code that is hidden or absent from the
  editable starter.

## 13. Acceptance Criteria

The feature is complete when:

- existing 90 lessons still validate and their authored solutions pass;
- a local multi-file lesson snapshot can validate through the browser and
  backend;
- the `register-user-use-case` arc is converted to multi-file snapshots and
  still passes source validation, generated-content checks, solution tests, and
  manual browser review;
- backend rejects unsafe, duplicate, missing, and unsupported paths with
  structured 400 responses;
- the runner writes nested source and test files correctly;
- Cargo diagnostics for multi-file compile errors are visible in the browser;
- the frontend editor still exposes only one editable file;
- no user-facing workflow allows editing multiple files in one lesson;
- docs accurately describe current support and remaining future runner modes.

Required validation before handoff:

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
```

## 14. Risks

| Risk | Mitigation |
| --- | --- |
| Path traversal or control-file overwrite | Backend-only path validation, v1 allowlist, generated manifest |
| Lessons become too large | One editable artifact, strict author review, file-size limits |
| Diagnostics become noisy | Keep Cargo JSON filtering, cap output, preserve compiler messages |
| Dependency drift | Keep dependency sets backend-controlled and runner-cached |
| Test concatenation assumptions break | Migrate adapter carefully and run all authored solutions |
| Authors rely on unsupported files | Source validator should reject paths the backend will reject |

## 15. Deferred Work

The following should be specified separately when a curriculum phase needs it:

- editable or readonly `Cargo.toml` support;
- multi-crate workspaces;
- compile-fail validation;
- `advanced-db` with SQLite and migrations;
- procedural macro workspaces;
- benchmark runner mode;
- author-only Miri checks;
- feature-matrix validation;
- richer diagnostics linked to readonly file tabs.

## 16. Open Questions

- Should `fixtures/**` and `testdata/**` be visible in the lesson UI by
  default, or collapsed behind a "support files" section?
- Should v1 require tests under `tests/`, or allow a generated smoke test for
  compile-only lessons?
- Do we want one explicit `editablePath` field in generated lesson detail, or
  is deriving it from the single `role: "editable"` file enough?
