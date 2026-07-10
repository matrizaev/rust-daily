# Compile-Fail Validation Implementation Plan

Status: implemented on July 10, 2026. This document now records the plan used
to implement [COMPILE_FAIL_VALIDATION_SPEC.md](COMPILE_FAIL_VALIDATION_SPEC.md)
and remains useful when adding the first public compile-fail lessons.

## 1. Target Outcome

Implement backend-native compile-fail validation:

- existing lessons keep using `backend-cargo-test` unchanged;
- new lessons may add `backend-compile-fail` inside an `all` validation block;
- the browser still exposes exactly one editable artifact;
- the frontend sends the normal project snapshot plus authored compile-fail
  cases;
- the backend validates compile-fail cases separately from project files;
- the runner checks the library first, then expects each case to fail under
  `cargo check --test`;
- diagnostics are grouped by case and checked with expected and forbidden
  substrings;
- source validation, generated-content checks, solution harness, and smoke
  tests all understand the new mode.

Do not add hidden tests, `trybuild`, multi-crate workspaces, learner-controlled
manifests, or multi-file editing in this feature.

## 2. Implementation Order

Do the work in this order:

1. Backend request model and validation.
2. Backend workspace and runner support.
3. Backend tests for validation and runner classification.
4. Frontend validation types and backend adapter support.
5. Source/generation/content checks.
6. Solution harness support.
7. Smoke script support.
8. Smoke canary cases.
9. Documentation and final validation.

Keep each checkpoint passing before moving to the next. The old two-file and
multi-file `backend-cargo-test` payloads must keep working throughout.

## 3. Backend Model Work

### 3.1 Add Request Mode

Edit `backend/src/model.rs`.

Add:

```rust
#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize, Eq, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum RunMode {
    #[default]
    CargoTest,
    CompileFail,
}
```

Update `RunRequest`:

```rust
pub struct RunRequest {
    #[serde(default)]
    mode: RunMode,
    files: Vec<SubmittedFile>,
    #[serde(default, rename = "dependencySet")]
    dependency_set: DependencySet,
    #[serde(default, rename = "compileFailCases")]
    compile_fail_cases: Vec<SubmittedCompileFailCase>,
}
```

Requirements:

- absent `mode` defaults to `cargo-test`;
- existing frontend payloads remain valid;
- `compileFailCases` defaults to empty;
- `RunRequest::new` and `with_dependency_set` keep producing cargo-test
  requests;
- add constructor helpers in tests for compile-fail requests.

### 3.2 Add Compile-Fail Case Types

Add raw and validated types:

```rust
pub struct SubmittedCompileFailCase {
    name: String,
    path: String,
    content: String,
    #[serde(rename = "expectedDiagnostics")]
    expected_diagnostics: Vec<String>,
    #[serde(default, rename = "forbiddenDiagnostics")]
    forbidden_diagnostics: Vec<String>,
}

pub struct ValidatedCompileFailCase {
    name: CompileFailCaseName,
    path: CompileFailPath,
    content: SubmittedContent,
    expected_diagnostics: Vec<DiagnosticSnippet>,
    forbidden_diagnostics: Vec<DiagnosticSnippet>,
}
```

Use small validated wrappers:

- `CompileFailCaseName`
- `CompileFailPath`
- `DiagnosticSnippet`

Validation rules:

- name is non-empty after trim;
- name contains only ASCII letters, digits, `_`, and `-`;
- name length <= 80;
- path is safe relative path syntax;
- path starts with `compile_fail/`;
- path ends with `.rs`;
- path has no empty, `.`, or `..` components;
- content uses the existing per-file size limit;
- expected diagnostics is non-empty;
- every diagnostic snippet is non-empty after trim;
- forbidden diagnostics snippets are optional but must be non-empty when
  present;
- case names are unique;
- case paths are unique.

Use first implementation constants:

```rust
const COMPILE_FAIL_PREFIX: &str = "compile_fail/";
const MAX_COMPILE_FAIL_CASES: usize = 4;
```

Keep `validation.max_files` scoped to project files. Count compile-fail case
bytes toward `max_total_bytes` so one request cannot bypass total payload
limits.

### 3.3 Extend ValidatedRunRequest

Update `ValidatedRunRequest`:

```rust
pub struct ValidatedRunRequest {
    mode: RunMode,
    files: BTreeMap<SubmittedPath, SubmittedContent>,
    dependency_set: DependencySet,
    compile_fail_cases: Vec<ValidatedCompileFailCase>,
}
```

Expose:

- `mode()`;
- `files()`;
- `dependency_set()`;
- `compile_fail_cases()`;

Validation behavior:

- `cargo-test` rejects any compile-fail cases;
- `compile-fail` requires at least one compile-fail case;
- `compile-fail` still requires `src/lib.rs`;
- `compile-fail` still requires at least one `tests/**/*.rs`;
- normal `files` must not accept `compile_fail/**`;
- duplicate normal file paths still reject as before.

### 3.4 Extend ValidationError

Add variants such as:

```rust
CompileFailCasesNotAllowed,
MissingCompileFailCases,
TooManyCompileFailCases { max: usize },
InvalidCompileFailCaseName { name: String },
DuplicateCompileFailCaseName { name: String },
DuplicateCompileFailCasePath { path: String },
MissingExpectedDiagnostics { name: String },
EmptyDiagnosticSnippet { name: String },
```

Re-use existing `UnsafePath`, `UnsupportedPath`, `FileTooLarge`, and
`TotalTooLarge` where possible. If path errors need to distinguish
compile-fail paths, add details in `backend/src/error.rs`.

Update API error mapping:

- stable snake-case codes;
- JSON details with `name`, `path`, `max`, or `max_bytes` where relevant.

## 4. Backend Workspace and Runner Work

### 4.1 Workspace Helpers

Edit `backend/src/workspace.rs`.

Keep `prepare_workspace` for normal project files. Add a helper to write one
compile-fail case into `tests/` after the normal workspace is created:

```rust
pub async fn write_compile_fail_case(
    workspace: &Path,
    case: &ValidatedCompileFailCase,
) -> Result<TestTargetName, WorkspaceError>
```

Generated target path:

```text
tests/compile_fail_<safe-case-name>.rs
```

Do not write cases under `compile_fail/` inside the Cargo workspace. Cargo
should see them as integration-test targets only for `cargo check --test`.

Rules:

- sanitize case names into valid test target names;
- avoid collisions after sanitization;
- overwrite only generated compile-fail test path for the current case;
- remove previous generated case before writing the next one, or use unique
  target names per case.

Preferred first implementation: unique generated file per case, no deletion
between cases. The workspace is temporary.

### 4.2 Cargo Command Abstraction

Edit `backend/src/dependency_set.rs`.

Current `DependencySet::test_command()` handles advanced dependency wrapper.
Add check command support:

```rust
pub fn test_command(self) -> CargoCommand;
pub fn check_lib_command(self) -> CargoCommand;
pub fn check_test_command(self, test_name: &str) -> CargoCommand;
```

For `std`:

```text
cargo test --offline --message-format=json
cargo check --lib --offline --message-format=json
cargo check --test <name> --offline --message-format=json
```

For `advanced`, prefer extending the runner image script rather than bypassing
it. Add scripts in the image if needed:

- `run-advanced-lesson-tests`;
- `run-advanced-lesson-check-lib`;
- `run-advanced-lesson-check-test <name>`.

The script should preserve the current dependency cache behavior and prevent
Cargo from downloading crates.

### 4.3 Runner Flow

Edit `backend/src/runner.rs`.

Split current `run_inner`:

```rust
match request.mode() {
    RunMode::CargoTest => run_cargo_test(...).await,
    RunMode::CompileFail => run_compile_fail(...).await,
}
```

`run_cargo_test` keeps current behavior.

`run_compile_fail`:

1. `prepare_workspace`.
2. Run `check_lib_command`.
3. If lib check returns success, continue.
4. If lib check returns compiler errors, return `RunStatus::CompileError`.
5. For each validated case:
   - write generated integration target;
   - run `check_test_command(test_name)`;
   - if command succeeds, record case failure: "compiled successfully";
   - if command times out, return `RunStatus::TimedOut`;
   - if command fails, collect filtered diagnostics and match snippets.
6. If every case failed with expected diagnostics, return `RunStatus::Passed`.
7. If any case compiled or failed for wrong reason, return `RunStatus::Failed`.

Use one temporary workspace per request.

### 4.4 Command Execution Helper

Extract current `execute_podman` into a reusable helper:

```rust
async fn execute_podman_command(
    workspace: &TempDir,
    command: CargoCommand,
    config: &RunnerSettings,
) -> Result<PodmanOutcome, io::Error>
```

Keep:

- no network;
- memory, CPU, PID, read-only, tmpfs, no-new-privileges, cap-drop;
- inner `timeout`;
- outer timeout;
- `--offline`;
- `--message-format=json`.

Avoid constructing shell strings. Pass program and args directly.

### 4.5 Cargo Output Helpers

Edit `backend/src/cargo_output.rs`.

Keep `result_from_output` for cargo-test.

Add helpers:

```rust
pub fn output_status(output: &Output) -> CargoOutputStatus;
pub fn response_output(output: &Output, max_output_bytes: usize) -> FilteredOutput;
pub fn diagnostic_text(output: &Output) -> String;
```

Need support:

- classify success, timeout, compiler error, test failure;
- filter cargo artifact JSON;
- keep compiler-message JSON or rendered text for diagnostics;
- match expected snippets against combined filtered stdout/stderr;
- cap final response output.

Do not break existing tests that verify compiler-artifact filtering.

### 4.6 Compile-Fail Result Formatting

Create small internal structs:

```rust
struct CompileFailCaseOutcome {
    name: String,
    status: CompileFailCaseStatus,
    diagnostics: String,
}

enum CompileFailCaseStatus {
    FailedAsExpected,
    CompiledUnexpectedly,
    MissingExpectedDiagnostics(Vec<String>),
    ContainsForbiddenDiagnostics(Vec<String>),
}
```

Final `RunResult` mapping:

- all `FailedAsExpected` => `RunStatus::Passed`;
- one or more case contract failures => `RunStatus::Failed`;
- lib compile error => `RunStatus::CompileError`;
- timeout => `RunStatus::TimedOut`;
- Podman/workspace error => `RunStatus::InternalError`.

`stdout` should contain concise case summaries. `stderr` should contain capped
diagnostics for failing cases.

## 5. Backend Test Matrix

### 5.1 Model Tests

Add tests in `backend/src/model.rs`:

- existing cargo-test payload still validates without `mode`;
- cargo-test rejects compile-fail cases;
- compile-fail accepts valid case;
- compile-fail rejects missing cases;
- compile-fail rejects too many cases;
- compile-fail rejects empty case name;
- compile-fail rejects names with spaces or shell-sensitive characters;
- compile-fail rejects duplicate names;
- compile-fail rejects duplicate paths;
- compile-fail rejects path outside `compile_fail/**/*.rs`;
- compile-fail rejects unsafe path syntax;
- compile-fail rejects empty expected diagnostics;
- compile-fail rejects empty diagnostic snippet;
- compile-fail counts case bytes toward total size;
- compile-fail requires `src/lib.rs`;
- compile-fail requires `tests/**/*.rs`;
- normal file list rejects `compile_fail/foo.rs`.

### 5.2 Workspace Tests

Add tests in `backend/src/workspace.rs`:

- writes generated case under `tests/compile_fail_<name>.rs`;
- preserves normal project files;
- generated test target name is stable;
- name sanitization rejects or normalizes safely;
- multiple cases create distinct test target paths.

### 5.3 Cargo Output Tests

Add tests in `backend/src/cargo_output.rs`:

- extracts diagnostic text from compiler-message JSON;
- ignores compiler-artifact JSON;
- matches rendered compiler diagnostics;
- classifies success/timeout/compiler error unchanged;
- caps compile-fail diagnostic output.

### 5.4 Runner Tests

Prefer unit tests around command selection and compile-fail result aggregation.
Do not require Podman in unit tests.

Add tests:

- lib compile error maps to `CompileError`;
- unexpected passing case maps to `Failed`;
- missing expected diagnostic maps to `Failed`;
- forbidden diagnostic maps to `Failed`;
- all cases expected-fail maps to `Passed`;
- timeout maps to `TimedOut`.

If direct runner tests are hard because Podman execution is embedded, extract a
small pure function for aggregating case results first.

Run:

```bash
make format
make lint
make test
```

## 6. Frontend Work

### 6.1 Types

Edit `frontend/src/types/validation.ts`.

Add:

```ts
export type CompileFailCase = {
  name: string;
  path: string;
  content: string;
  expectedDiagnostics: string[];
  forbiddenDiagnostics?: string[];
};
```

Extend `LessonValidationStep` with:

```ts
{
  mode: "backend-compile-fail";
  timeoutMs: number;
  dependencySet?: DependencySet;
  cases: CompileFailCase[];
}
```

### 6.2 Backend Adapter

Edit `frontend/src/validation/backendValidation.ts`.

Changes:

- support `backend-compile-fail` in `BackendValidationRequest`;
- build request with `mode: "compile-fail"`;
- include normal snapshot files unchanged;
- include `compileFailCases`;
- use dependency set from compile-fail step;
- parse backend result same as cargo-test result.

Keep legacy test fallback only for `backend-cargo-test`. Compile-fail should
not synthesize tests.

### 6.3 Validation Client

Edit `frontend/src/validation/validationClient.ts`.

Changes:

- treat `backend-compile-fail` as backend step;
- label it `Compile-fail checks`;
- include it in timeout calculation;
- run it concurrently with other `all` steps only if backend queue pressure is
  acceptable.

Preferred first implementation: keep current concurrent `all` behavior. The
source validator requires positive cargo-test, so both steps run.

### 6.4 UI

Edit `frontend/src/components/ValidationPanel.tsx` only if needed.

Current diagnostics panel may be enough if backend summaries are concise.
If adding case-level failures:

- use `ValidationFailure` entries named by case;
- show missing or forbidden snippets as failure messages;
- keep compiler diagnostics in `<pre>`.

### 6.5 Readonly Case Display

First implementation may not display compile-fail cases as separate readonly
files. If author review shows confusion, add a "Compile-fail cases" readonly
group later.

Minimum requirement:

- do not show them as editable;
- do not list them as normal project files;
- validation result names cases clearly.

Run:

```bash
cd frontend
npm run build
yes | npx fallow dupes
yes | npx fallow dead-code
yes | npx fallow health
```

## 7. Source and Generated Content Work

### 7.1 Source Validator

Edit `frontend/scripts/curriculum/validate-source-content.mjs`.

Add helpers:

- `isBackendCompileFailValidation`;
- `validateCompileFailCases`;
- `validateCompileFailSourcePath`;
- `validateCompileFailRequiresCargoTestSibling`;
- `validateCompileFailDependencySetMatches`.

Rules:

- `backend-compile-fail` allowed only as a child of `all`;
- same `all.validations` must include `backend-cargo-test`;
- case list non-empty;
- unique case names and source paths;
- `sourcePath` safe and under `compile_fail/**/*.rs`;
- source file exists;
- expected diagnostics non-empty;
- forbidden diagnostics, when present, non-empty;
- `lesson.files` must not include `compile_fail/**`;
- compile-fail cases do not count as editable/readonly/test lesson files.

### 7.2 Content Generator

Edit `frontend/scripts/curriculum/generate-frontend-content.mjs`.

Behavior:

- read each case `sourcePath`;
- emit generated case as `{ name, path, content, expectedDiagnostics,
  forbiddenDiagnostics }`;
- omit `sourcePath` from generated runtime content;
- preserve ordering from source JSON.

### 7.3 Generated Content Validator

Edit `frontend/scripts/validate-content.mjs`.

Add schema validation for generated `backend-compile-fail`:

- mode is known;
- timeout positive;
- dependency set valid;
- cases non-empty;
- names, paths, contents, expected diagnostics valid;
- paths under `compile_fail/**/*.rs`.

### 7.4 Reference Checker

Edit `frontend/scripts/curriculum/check-content-refs.mjs`.

Add parity checks:

- generated compile-fail case count equals source;
- case names and paths match;
- generated content equals source file content;
- expected and forbidden diagnostics match.

Run:

```bash
cd frontend
npm run content:validate-source
npm run content:generate
npm run content:check-refs
npm run content:check
```

## 8. Solution Harness Work

Edit `scripts/test-lesson-solutions.sh`.

Add Node helper to read compile-fail cases from `lesson.json`.

Source JSON uses `sourcePath`, so the shell harness can:

1. detect `backend-compile-fail` steps;
2. run normal positive cargo tests first;
3. copy each compile-fail source into generated integration target:
   `tests/compile_fail_<case-name>.rs`;
4. run:

```bash
cargo check --manifest-path "$crate_dir/Cargo.toml" \
  --offline --test "$generated_target" --message-format=json
```

5. require non-zero exit;
6. match expected diagnostics against combined stdout/stderr;
7. reject forbidden diagnostics.

Keep output terse:

```text
passed lessons/<arc>/<lesson> compile_fail/<case>.rs
```

Fail with lesson path and case name.

Run:

```bash
scripts/test-lesson-solutions.sh lessons
```

## 9. Smoke Script Work

Edit `scripts/play_run.py`.

Add cases:

- `compile-fail-pass`;
- `compile-fail-unexpected-pass`;
- `compile-fail-wrong-diagnostic`.

Payload design:

`compile-fail-pass`:

- `src/lib.rs` defines a type with private field and public constructor;
- positive test uses constructor;
- compile-fail case tries struct literal construction;
- expected diagnostic includes `private`.

`compile-fail-unexpected-pass`:

- library makes the field public;
- compile-fail case compiles;
- expected result status is `failed`.

`compile-fail-wrong-diagnostic`:

- compile-fail case references missing name;
- expected diagnostic asks for private field snippet;
- expected result status is `failed`.

Update README and DEPLOYMENT smoke docs after implementation:

```bash
make smoke-runner SMOKE_CASE=compile-fail-pass
```

## 10. Canary Lesson or Fixture

Before authoring lessons 91-150, add one small canary.

Preferred canary:

- arc: a future advanced ownership/API arc fixture, or a hidden validation
  fixture if no curriculum lesson should ship yet;
- concept: private field construction or borrowed output lifetime;
- one editable file;
- one positive test;
- one compile-fail case.

Do not add a new public curriculum lesson unless the user explicitly wants the
curriculum count to change. A non-shipped fixture can prove tooling first.

## 11. Documentation Updates

Update:

- `README.md`: add compile-fail smoke command after implementation;
- `ARCHITECTURE.md`: add `backend-compile-fail` validation flow;
- `docs/SPEC.md`: move compile-fail from exclusion to current support;
- `docs/DEPLOYMENT.md`: add compile-fail smoke case;
- `docs/FUTURE_ADVANCED_CONCEPTS_IMPLEMENTATION_PLAN.md`: mark prerequisite as
  complete only after implementation and canary pass.

Do not delete this plan until the feature is implemented and docs are updated.

## 12. Checkpoints

| Checkpoint | Required state |
| --- | --- |
| Backend model | Old requests validate; compile-fail requests validate/reject correctly |
| Runner core | Pure aggregation tests pass; no Podman unit-test dependency |
| Frontend adapter | TypeScript build passes; old cargo-test validation unchanged |
| Content tooling | Source/generation/check/check-refs pass |
| Harness | Existing lessons pass; canary compile-fail passes |
| Smoke | Local `/run` proves compile-fail pass and unexpected-pass cases |
| Docs | README, architecture, spec, deployment, roadmap describe current support |

## 13. Final Validation

Run full validation before handoff:

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
git diff --check
```

For browser confidence, run one canary lesson through the built frontend and
confirm:

- one editable file is visible;
- compile-fail cases are not editable;
- positive and compile-fail backend steps run;
- result passes with the authored solution.

## 14. Review Hot Spots

- `mode` default must keep existing `/run` clients compatible.
- Compile-fail case paths must never be accepted as normal project files.
- Library compile errors must be `compile_error`; contract failures must be
  `failed`.
- Diagnostic matching should be durable across Rust patch versions.
- Advanced dependency-set commands must use cached dependencies offline.
- Source and generated validators must agree on sourcePath/content parity.
- The solution harness must run positive tests before compile-fail cases.
- Do not add multi-file editing while adding compile-fail support.
