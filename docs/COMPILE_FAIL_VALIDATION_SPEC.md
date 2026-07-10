# Compile-Fail Validation Feature Spec

Status: implemented as the current backend-native compile-fail validation
contract. The implementation record is maintained in
[COMPILE_FAIL_VALIDATION_IMPLEMENTATION_PLAN.md](COMPILE_FAIL_VALIDATION_IMPLEMENTATION_PLAN.md).

## 1. Summary

Rust Daily needs a validation mode for code that is correct because certain
invalid uses do not compile.

The current runner can prove that authored positive examples compile and pass
tests. It cannot prove that an API rejects invalid construction, invalid
borrows, missing trait bounds, object-unsafe usage, or other compile-time
contracts. That blocks many advanced ownership and API design lessons.

This feature adds backend compile-fail validation while preserving the core
product rule: each lesson exposes exactly one editable artifact. Compile-fail
cases are authored public validation artifacts, compiled with the learner's
snapshot, and expected to produce compiler diagnostics.

## 2. Problem

Advanced Rust often teaches negative API space:

- a borrowed value must not outlive its input;
- a type cannot be constructed through private fields;
- a trait should or should not be object safe;
- a generic function should require a specific bound;
- an API should reject unnecessary ownership or `'static` requirements;
- a macro should reject invalid syntax or missing arguments.

Runtime tests cannot express these constraints directly. Structural snippet
checks are too weak and can force non-idiomatic code. Without compile-fail
validation, lessons either become prose-only or validate the wrong behavior.

## 3. Goals

- Add a deterministic validation step for expected compiler failures.
- Keep exactly one editable artifact per lesson.
- Compile fail cases against the complete project snapshot.
- Require positive compile/test validation alongside compile-fail validation.
- Report case-level failures clearly in the browser.
- Keep dependency sets explicit and backend-controlled.
- Keep all compile-fail cases public and author-controlled.
- Reuse the existing backend queue, Podman runner, timeout, output cap, and
  Cargo JSON filtering where practical.
- Support lessons 91-150 on advanced ownership, lifetimes, trait bounds, and
  object safety.

## 4. Non-Goals

- No hidden compile-fail tests.
- No multi-file learner editing.
- No learner-controlled `Cargo.toml`.
- No multi-crate workspaces in the first implementation.
- No procedural macro crate support in the first implementation.
- No `trybuild` integration in the first implementation.
- No exact stderr snapshot testing in the first implementation.
- No regex diagnostics unless substring matching proves insufficient.
- No browser-based Rust compiler.

`trybuild` remains useful later for procedural macro lessons. The first
implementation should be backend-native because ownership and API lessons only
need ordinary `cargo check` failures.

## 5. Product Contract

A compile-fail lesson still has one editable file.

The lesson may include:

- normal readonly project files;
- normal public runtime tests;
- one or more compile-fail cases.

Validation passes only when:

1. the learner's project snapshot compiles and passes positive tests; and
2. every compile-fail case fails to compile; and
3. each failing case includes the expected diagnostic snippets; and
4. no failing case includes any explicitly forbidden diagnostic snippets.

Compile-fail cases are public, like current public tests. Rust Daily remains a
practice tool, not tamper-resistant grading.

## 6. Lesson Authoring Model

Canonical lesson source should use a separate compile-fail directory:

```text
lessons/<arc>/<lesson>/
  lesson.json
  starter/<project files>
  solution/<editable path>
  tests/<positive public tests>
  compile_fail/<case>.rs
  notes.md
```

The compile-fail files are not part of the normal project snapshot submitted to
`backend-cargo-test`. They are attached only to the compile-fail validation
step.

Example source validation:

```json
{
  "mode": "all",
  "validations": [
    {
      "mode": "backend-cargo-test",
      "timeoutMs": 15000,
      "dependencySet": "std"
    },
    {
      "mode": "backend-compile-fail",
      "timeoutMs": 15000,
      "dependencySet": "std",
      "cases": [
        {
          "name": "private-field-construction",
          "sourcePath": "compile_fail/private_field_construction.rs",
          "expectedDiagnostics": [
            "field `value` of struct `UserId` is private"
          ]
        }
      ]
    }
  ]
}
```

Generated frontend content may inline case content:

```json
{
  "mode": "backend-compile-fail",
  "timeoutMs": 15000,
  "dependencySet": "std",
  "cases": [
    {
      "name": "private-field-construction",
      "path": "compile_fail/private_field_construction.rs",
      "content": "use rust_daily_lesson::UserId;\n\nfn main() {\n    let _ = UserId { value: 1 };\n}\n",
      "expectedDiagnostics": [
        "field `value` of struct `UserId` is private"
      ],
      "forbiddenDiagnostics": [
        "cannot find type `UserId`"
      ]
    }
  ]
}
```

## 7. Validation Schema

Add a validation mode:

```ts
type CompileFailCase = {
  name: string;
  path: string;
  content: string;
  expectedDiagnostics: string[];
  forbiddenDiagnostics?: string[];
};

type BackendCompileFailValidation = {
  mode: "backend-compile-fail";
  timeoutMs: number;
  dependencySet?: DependencySet;
  cases: CompileFailCase[];
};
```

Rules:

- `cases` must be non-empty;
- case names must be unique and stable;
- case paths must be under `compile_fail/**/*.rs`;
- expected diagnostics must be non-empty strings;
- forbidden diagnostics are optional non-empty strings;
- a lesson using `backend-compile-fail` must also use `backend-cargo-test` in
  the same `all` validation block;
- dependency set must match the positive Cargo step in the same `all`
  validation block.

## 8. Backend API

Keep using `/run`, but add a request mode with a backwards-compatible default:

```json
{
  "mode": "cargo-test",
  "dependencySet": "std",
  "files": []
}
```

New compile-fail request:

```json
{
  "mode": "compile-fail",
  "dependencySet": "std",
  "files": [
    { "path": "src/lib.rs", "content": "..." },
    { "path": "tests/public.rs", "content": "..." }
  ],
  "compileFailCases": [
    {
      "name": "private-field-construction",
      "path": "compile_fail/private_field_construction.rs",
      "content": "...",
      "expectedDiagnostics": ["field `value`"],
      "forbiddenDiagnostics": ["cannot find type"]
    }
  ]
}
```

`mode` defaults to `cargo-test` so existing clients keep working.

Backend validation must:

- keep current project-file path validation for `files`;
- validate compile-fail case names and paths separately;
- reject duplicate case names and paths;
- apply existing file count and size limits, or introduce explicit compile-fail
  case limits if clearer;
- require `src/lib.rs`;
- require at least one positive `tests/**/*.rs` file for compile-fail requests;
- reject compile-fail case paths in the normal submitted `files` map.

## 9. Runner Behavior

For `mode: "compile-fail"`:

1. Create the temporary workspace from the normal validated project snapshot.
2. Generate backend-controlled `Cargo.toml`.
3. Run `cargo check --offline --lib` first.
4. If the library does not compile, return `compile_error`.
5. For each compile-fail case:
   - write the case as a generated integration test target under `tests/`;
   - run `cargo check --offline --test <generated-case-name>`;
   - expect Cargo to return a compiler failure;
   - collect compiler diagnostics;
   - require all expected diagnostic snippets;
   - reject any forbidden diagnostic snippets.
6. Return `passed` only when every case fails for the expected reason.

If a compile-fail case unexpectedly compiles, return `failed`, not
`compile_error`. The learner's code compiled, but the API contract is too weak.

If a case fails for the wrong reason, return `failed` with the missing or
forbidden diagnostic snippets listed by case.

## 10. Diagnostics

Learner-facing output should group results by case:

```text
Compile-fail case `private-field-construction` failed as expected.
```

Failure examples:

```text
Compile-fail case `private-field-construction` compiled successfully, but it
was expected to fail.
```

```text
Compile-fail case `borrowed-output-outlives-input` failed, but diagnostics did
not include `E0515`.
```

Cargo `compiler-artifact` records must stay filtered. `compiler-message`
records should remain visible enough to diagnose the case.

## 11. Frontend Requirements

Frontend validation must:

- add `backend-compile-fail` to validation types;
- include compile-fail cases in backend requests only for that step;
- keep normal project files unchanged;
- label the step as `Compile-fail checks`;
- merge results with `backend-cargo-test` in `all` validation;
- show case-level failures in `ValidationPanel`;
- keep readonly files and compile-fail cases non-editable.

Compile-fail cases may be displayed with readonly files or in a separate
readonly "Compile-fail cases" group. The UI should not imply hidden tests.

## 12. Source and Generated Content Tooling

Source validation must check:

- `backend-compile-fail` appears only inside `all`;
- the same `all` block includes `backend-cargo-test`;
- every case has `name`, `sourcePath`, and expected diagnostics;
- `sourcePath` exists and is under `compile_fail/**/*.rs`;
- case names and source paths are unique;
- compile-fail files are not listed as normal runnable `lesson.files`;
- generated content includes the case content and does not expose author notes;
- final hint solution still matches the editable solution file.

Content generation must inline compile-fail case content into generated lesson
details, similar to public tests.

`content:check` and `content:check-refs` must validate generated parity for
compile-fail cases.

## 13. Solution Harness

`scripts/test-lesson-solutions.sh` must support compile-fail validation:

1. build the temporary crate from starter files;
2. overlay the solution for the editable file;
3. copy normal public tests;
4. run positive `cargo test --offline`;
5. for each compile-fail case, write the case as an integration target;
6. run `cargo check --offline --test <case>`;
7. require failure and expected diagnostic snippets.

The harness should fail fast with the lesson path and case name.

## 14. Smoke Tests

Add smoke cases to `scripts/play_run.py`:

- `compile-fail-pass`: valid library, invalid case fails for expected reason;
- `compile-fail-unexpected-pass`: invalid case compiles and runner reports
  failed;
- `compile-fail-wrong-diagnostic`: case fails, but expected snippet is
  missing.

Smoke usage is documented in README and deployment docs.

## 15. Security and Isolation

Compile-fail validation runs untrusted Rust and must keep the existing runner
boundary:

- rootless Podman;
- no network;
- backend-generated manifest;
- no learner-supplied build scripts or control files;
- existing timeout and output caps;
- temporary workspace cleanup;
- bounded queue.

Compile-fail cases are public and submitted by the browser, so they do not
change the trust model.

## 16. Acceptance Criteria

The feature is complete when:

- existing `backend-cargo-test` lessons still pass unchanged;
- new `backend-compile-fail` schema is validated in source and generated
  content;
- backend rejects malformed compile-fail cases with structured errors;
- backend returns `passed` when every case fails with expected diagnostics;
- backend returns `failed` when any case compiles unexpectedly;
- backend returns `failed` when diagnostics miss expected snippets or contain
  forbidden snippets;
- learner library compile failures still return `compile_error`;
- frontend renders compile-fail results clearly;
- solution harness supports compile-fail lessons;
- smoke script covers passing, unexpected-pass, and wrong-diagnostic cases;
- the smoke cases prove the end-to-end path before public compile-fail lessons
  are authored.

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
make smoke-runner SMOKE_CASE=compile-fail-pass
make smoke-runner SMOKE_CASE=compile-fail-unexpected-pass
```

## 17. First Public Lesson Targets

Good first public lesson targets:

- private field construction for a value object;
- borrowed output cannot outlive input;
- trait object intentionally rejected or accepted;
- generic API requires `AsRef<str>` or `Borrow<T>`;
- builder cannot be used before required state is present, if represented by
  types.

Pick one small target before authoring new phase-1 arcs.

## 18. Risks

| Risk | Mitigation |
| --- | --- |
| Diagnostics differ across Rust versions | Match stable error codes or short durable substrings |
| Wrong failure accepted | Require expected snippets and optional forbidden snippets |
| Compile-fail files accidentally enter normal tests | Separate source directory and source validator checks |
| Slow validation | Limit cases per lesson and reuse existing runner timeouts |
| Authors overuse compile-fail checks | Require positive tests and review rubric |
| Learners see noisy compiler output | Group diagnostics by case and cap output |

## 19. Open Questions

- Should `expectedDiagnostics` require at least one Rust error code such as
  `E0515` when rustc provides one?
- Should matching support regex later, or are substrings enough?
- Should compile-fail cases eventually display beside readonly files by
  default?
- Should case-level timeout be separate from total validation timeout?
- Should generated case paths be visible exactly as authored or normalized into
  `tests/compile_fail_<name>.rs` in diagnostics?
