# Authoring Harness Implementation Plan

Status: initial implementation landed for the command surface, changed-work
validation, PR gate, scaffold dry-run, deterministic real-world checks, and
parallel solution runner. Full source-validator and scaffolder module
decomposition remains follow-up hardening for maintainability.

## Purpose

This plan turns the authoring harness feature spec into ordered implementation
work. The goal is to remove authoring friction before large-scale lesson work
resumes, without changing the product contract:

- one editable artifact per lesson;
- canonical source under `lessons/`;
- generated runtime content under `frontend/src/content/` and
  `frontend/public/content/lessons/`;
- single-crate runner snapshots only;
- deterministic validation for authoring quality, including real-world fit.

## Implementation Principles

- Preserve existing commands until replacements are proven. Add compatibility
  wrappers where command paths move.
- Prefer small mechanical moves before behavior changes.
- Keep every phase independently mergeable and validated.
- Add tests before or alongside behavior changes.
- Keep author-facing error output stable and concise.
- Make CI use the same commands authors run locally.

## Target Command Surface

New root command entrypoints live under `scripts/curriculum/`.

| Command | Purpose |
| --- | --- |
| `scripts/curriculum/plan-arc` | Validate or draft a new arc plan |
| `scripts/curriculum/scaffold-lesson` | Create the next lesson skeleton |
| `scripts/curriculum/review` | Produce arc/lesson review report |
| `scripts/curriculum/validate-source` | Validate canonical source lessons |
| `scripts/curriculum/validate-changed` | Validate lessons changed vs `origin/main` |
| `scripts/curriculum/generate` | Generate runtime content |
| `scripts/curriculum/check-generated` | Check generated content and refs |
| `scripts/curriculum/author-check` | Run normal local authoring gate |

Existing npm scripts may remain as wrappers during migration:

```text
cd frontend
npm run content:validate-source
npm run content:generate
npm run content:check-refs
npm run content:check
npm run content:scaffold-lesson
```

## Phase 0: Baseline Safety

### Tasks

1. Record current command behavior and outputs for:
   - `npm run content:validate-source`
   - `npm run content:generate`
   - `npm run content:check-refs`
   - `npm run content:check`
   - `npm run content:scaffold-lesson -- --help`
   - `scripts/test-lesson-solutions.sh --help`
2. Add smoke tests around current CLI behavior where missing:
   - successful source validation fixture;
   - invalid path fixture;
   - duplicate editable file fixture;
   - final hint mismatch fixture;
   - compile-fail validation fixture;
   - scaffolder dry-run fixture once dry-run exists.
3. Add a fixture directory for curriculum script tests under:

```text
frontend/scripts/curriculum/__fixtures__/
```

### Acceptance

- Existing commands still pass.
- Existing tests still pass:

```text
cd frontend
npm run content:validate-source:test
npm run content:scaffold-lesson:test
```

## Phase 1: Root Command Wrappers

### Tasks

1. Create `scripts/curriculum/`.
2. Add thin root wrappers that delegate to existing implementation:
   - `scripts/curriculum/validate-source`
   - `scripts/curriculum/generate`
   - `scripts/curriculum/check-generated`
   - `scripts/curriculum/scaffold-lesson`
3. Ensure wrappers:
   - are executable;
   - can be run from any working directory;
   - preserve exit codes;
   - preserve current stdout/stderr;
   - pass through args unchanged.
4. Update `package.json` scripts to call root wrappers or keep old scripts as
   compatibility aliases.
5. Update `AGENTS.md`, `frontend/AGENTS.md`, and relevant docs to name root
   commands first.

### Files

- `scripts/curriculum/validate-source`
- `scripts/curriculum/generate`
- `scripts/curriculum/check-generated`
- `scripts/curriculum/scaffold-lesson`
- `frontend/package.json`
- `AGENTS.md`
- `frontend/AGENTS.md`

### Acceptance

```text
scripts/curriculum/validate-source
scripts/curriculum/generate
scripts/curriculum/check-generated
scripts/curriculum/scaffold-lesson --help
cd frontend && npm run content:validate-source
cd frontend && npm run content:generate
cd frontend && npm run content:check-refs && npm run content:check
```

## Phase 2: Generated Content Parity

### Tasks

1. Add dry-run generation parity mode:

```text
scripts/curriculum/generate --check
```

2. Implement by generating into a temporary staging directory and comparing:
   - `frontend/src/content/lessons.json`
   - `frontend/src/content/lessonIndex.json`
   - `frontend/src/content/concepts.json`
   - `frontend/src/content/contentRevision.json`
   - `frontend/public/content/lessons/*.json`
3. Report changed, missing, and extra generated files.
4. Ensure normal `generate` still uses staged writes and atomic replacement.
5. Make `scripts/curriculum/check-generated` run:
   - generated parity check;
   - content reference check;
   - runtime content check.

### Acceptance

```text
scripts/curriculum/generate --check
scripts/curriculum/check-generated
```

Expected clean output when generated content is current. If a source lesson is
edited without regeneration, `generate --check` fails and names affected files.

## Phase 3: Changed Lesson Detection

### Tasks

1. Add a changed-source detector using `origin/main` as default base.
2. Support:

```text
scripts/curriculum/changed-lessons
scripts/curriculum/changed-lessons --format json
scripts/curriculum/changed-lessons --base origin/main
```

3. Detection rules:
   - changed `lessons/<arc>/<lesson>/**` includes that lesson;
   - changed `lessons/<arc>/**` metadata may include all lessons in that arc;
   - changed `lessons/arcs.json` includes affected arcs when identifiable,
     otherwise all lessons;
   - changed `lessons/concepts.json` includes lessons referenced by changed
     concept records when identifiable, otherwise all lessons;
   - changed curriculum scripts include all lessons for validation, but solution
     tests may remain changed-only unless script behavior touches solution test
     mechanics.
4. Output stable sorted paths:

```text
lessons/config-service/006-config-borrowed-key
```

5. Provide empty success when no lesson-affecting files changed.

### Acceptance

Create fixture tests for:

- one lesson file changed;
- one arc metadata change;
- concepts change;
- generated-only content change;
- no lesson changes.

## Phase 4: Parallel And Changed Solution Tests

### Tasks

1. Extend `scripts/test-lesson-solutions.sh`:
   - `--changed`
   - `--base origin/main`
   - `--jobs N`
   - `--list`
   - `--format text|json`
2. Preserve current positional target behavior:

```text
scripts/test-lesson-solutions.sh lessons
scripts/test-lesson-solutions.sh lessons/config-service
scripts/test-lesson-solutions.sh lessons/config-service/006-config-borrowed-key
```

3. Parallel execution requirements:
   - stable final summary;
   - readable first failure;
   - per-lesson temp crate isolation;
   - safe shared target directory or per-worker target directories;
   - no interleaved unreadable logs in normal mode.
4. JSON output fields:

```json
{
  "base": "origin/main",
  "target": "changed",
  "jobs": 4,
  "lessons": [
    {
      "path": "lessons/config-service/006-config-borrowed-key",
      "status": "passed",
      "dependencySet": "std",
      "tests": 3,
      "compileFailCases": 0,
      "durationMs": 1234
    }
  ],
  "summary": {
    "passed": 1,
    "failed": 0,
    "durationMs": 1234
  }
}
```

5. Keep compile-fail diagnostics matching exactly as current script does.

### Acceptance

```text
scripts/test-lesson-solutions.sh --list --changed
scripts/test-lesson-solutions.sh --changed --jobs 4
scripts/test-lesson-solutions.sh --format json lessons/config-service/006-config-borrowed-key
scripts/test-lesson-solutions.sh lessons/config-service/006-config-borrowed-key
```

## Phase 5: Author Check Command

### Tasks

Add:

```text
scripts/curriculum/author-check
```

Default behavior:

1. `scripts/curriculum/validate-source`
2. `scripts/curriculum/generate --check`
3. `scripts/curriculum/check-generated`
4. `scripts/test-lesson-solutions.sh --changed --jobs <auto>`

Options:

```text
--base origin/main
--jobs N
--all-lessons
--skip-solutions
--format text|json
```

### Acceptance

- Clean repo passes.
- Source edit without generated content fails at parity step.
- Broken lesson solution fails at changed solution step.
- JSON mode is usable in CI.

## Phase 6: PR CI Quality Gate

### Tasks

Create `.github/workflows/pr_quality.yml`.

Trigger:

```yaml
on:
  pull_request:
```

Jobs:

1. Backend:
   - Rust 1.95
   - `make format`
   - `make lint`
   - `make test`
2. Frontend:
   - Node 24
   - `npm ci`
   - `npm run build`
   - `npm run test`
   - `yes | npx fallow dupes`
   - `yes | npx fallow dead-code`
   - `yes | npx fallow health`
3. Content:
   - `scripts/curriculum/validate-source`
   - `scripts/curriculum/generate --check`
   - `scripts/curriculum/check-generated`
   - `scripts/test-lesson-solutions.sh --changed --jobs 4 --base origin/main`
4. Curriculum scripts:
   - run only when `frontend/scripts/curriculum/**`, `scripts/curriculum/**`, or
     `scripts/test-lesson-solutions.sh` changes;
   - `cd frontend && npm run content:scaffold-lesson:test`
   - `cd frontend && npm run content:validate-source:test`

### Acceptance

- PR workflow passes on current branch once wrappers exist.
- Broken generated content fails.
- Broken changed lesson solution fails.
- Main deploy workflow remains deploy-focused.

## Phase 7: Runner Smoke Aggregate

### Tasks

Add:

```text
scripts/smoke-runner-all
```

Behavior:

- accepts `--url`;
- runs all `scripts/play_run.py --case ...` cases:
  - `pass`
  - `fail`
  - `compile-error`
  - `timeout`
  - `multi-file-pass`
  - `compile-fail-pass`
  - `compile-fail-unexpected-pass`
  - `compile-fail-wrong-diagnostic`
  - `advanced-pass`
- prints stable summary;
- exits on first failure by default;
- supports `--keep-going`;
- supports `--format json`.

### Acceptance

```text
make runner-image
RUST_DAILY_RUNNER__IMAGE=rust-runner:1.95 cargo run --manifest-path backend/Cargo.toml
scripts/smoke-runner-all --url http://127.0.0.1:8080
```

If Podman is unavailable, report not run with environment reason.

## Phase 8: Source Validator Decomposition

### Tasks

Move validation code into focused modules under `scripts/curriculum/`.

Target modules:

```text
scripts/curriculum/lib/paths.mjs
scripts/curriculum/lib/json.mjs
scripts/curriculum/lib/source-read.mjs
scripts/curriculum/lib/schema-shape.mjs
scripts/curriculum/lib/lesson-files.mjs
scripts/curriculum/lib/validation-steps.mjs
scripts/curriculum/lib/author-solution.mjs
scripts/curriculum/lib/continuity.mjs
scripts/curriculum/lib/review-rules.mjs
scripts/curriculum/lib/reporting.mjs
```

Migration order:

1. Move pure shared helpers with no behavior change.
2. Move path policy and source reading.
3. Move schema shape checks.
4. Move lesson file checks.
5. Move validation step checks.
6. Move author solution and final hint parity.
7. Move continuity checks.
8. Add review rules.
9. Keep `frontend/scripts/curriculum/validate-source-content.mjs` as wrapper
   until npm scripts are fully migrated.

### Tests

For each module, add fixture-based tests using small temporary lesson roots.
Keep existing integration tests.

### Acceptance

- Current content source validation passes.
- Existing source validation tests pass.
- New module tests pass.
- Diff is mostly movement until review-rule behavior lands.

## Phase 9: Deterministic Real-World Fit Validation

### Tasks

Implement deterministic rules that catch obvious contrived lessons without
pretending to judge all quality automatically.

Initial rules:

- `scenario` must include a project context noun from an allowlist or arc-local
  vocabulary:
  - config, request, response, service, repository, adapter, parser, log,
    event, command, inventory, user, money, email, host, port, retry, timeout,
    validation, persistence, boundary, DTO, test, fixture.
- `instructions` must name an API/type/function that exists in starter or is
  explicitly expected to be created.
- if previous arc lessons define domain structs/enums, later lesson starter must
  keep using at least one of those domain names unless `notes.md` contains
  `Intentional domain reset:`;
- final lesson in an arc must preserve at least one public behavior from the
  previous lesson unless `notes.md` contains `Intentional behavior migration:`;
- lessons using tuple pairs, raw `String` maps, or placeholder records after a
  domain type exists must fail unless notes contain `Intentional raw boundary:`.

### Acceptance

- Existing 90 lessons pass after fixing any legitimate issues.
- A fixture with tuple-key-value detour after a `Config` domain type fails.
- A fixture with deliberate raw boundary plus author note passes.
- Error output names the deterministic rule and notes escape hatch.

## Phase 10: Scaffolder Decomposition And Dry Run

### Tasks

Move scaffolder internals under `scripts/curriculum/lib/`.

Target modules:

```text
scripts/curriculum/lib/parse-author-cli.mjs
scripts/curriculum/lib/read-curriculum-state.mjs
scripts/curriculum/lib/derive-next-lesson.mjs
scripts/curriculum/lib/validate-scaffold-request.mjs
scripts/curriculum/lib/copy-continuity-sources.mjs
scripts/curriculum/lib/write-scaffold-files.mjs
scripts/curriculum/lib/scaffold-report.mjs
```

Add:

```text
scripts/curriculum/scaffold-lesson --dry-run ...
scripts/curriculum/scaffold-lesson --list-presets
```

Dry-run report includes:

- lesson ID;
- arc day/order;
- files to create;
- files copied from previous solution;
- concept/arc metadata changes;
- validation commands to run.

### Acceptance

- Existing scaffolder tests pass.
- Dry-run writes no files.
- `--force` refuses to overwrite non-placeholder authored files.
- Preset listing includes dependency set and intended lesson shape.

## Phase 11: Arc Planning And Review Commands

### `plan-arc`

Tasks:

- validate arc ID/title/lesson count;
- show neighboring global order range;
- optionally register arc metadata with `--write`;
- optionally create concept placeholders;
- output proposed lesson slots.

Acceptance:

```text
scripts/curriculum/plan-arc --arc async-retries --title "Async Retries" --lessons 6
scripts/curriculum/plan-arc --arc async-retries --title "Async Retries" --lessons 6 --write
```

### `review`

Tasks:

- run source validation for target;
- run generated parity check;
- run affected solution tests unless `--skip-solutions`;
- print rubric checklist with deterministic pass/fail where available;
- include manual review prompts for non-deterministic judgment.

Acceptance:

```text
scripts/curriculum/review lessons/config-service
scripts/curriculum/review lessons/config-service/006-config-borrowed-key --format json
```

## Phase 12: Documentation Migration

### Tasks

Update:

- `AGENTS.md`
- `frontend/AGENTS.md`
- `docs/CURRICULUM_REVIEW_RUBRIC.md`
- `docs/FUTURE_ADVANCED_CONCEPTS_IMPLEMENTATION_PLAN.md`
- `docs/SPEC.md`
- `README.md`

Ensure all docs name root `scripts/curriculum/` commands first and treat old
npm commands as compatibility paths.

### Acceptance

```text
rg "frontend/scripts/curriculum|content:scaffold-lesson|content:validate-source" docs AGENTS.md frontend/AGENTS.md README.md
```

Remaining matches should be compatibility notes only.

## Rollout Order

1. Root wrappers and generated parity.
2. Changed lesson detection.
3. Parallel solution runner.
4. Author-check command.
5. PR CI.
6. Smoke aggregate.
7. Source validator decomposition.
8. Deterministic real-world fit checks.
9. Scaffolder decomposition and dry-run.
10. Arc planning and review commands.
11. Documentation migration.

This order gives authors immediate value before large script refactors.

## Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Script movement breaks existing npm commands | keep wrappers and run old/new command parity in tests |
| Changed lesson detection misses impacted lessons | include whole arc for metadata/continuity changes; fall back to all lessons when uncertain |
| Parallel Cargo output becomes unreadable | buffer per-lesson logs and print first failure with reproduction command |
| Real-world fit rules overreject good lessons | start with narrow deterministic rules and explicit author-note escape hatches |
| CI time grows too much | changed lesson tests only on PR; full corpus manual/release only |
| Root and frontend script paths diverge | root commands own behavior; npm scripts delegate |

## Completion Definition

The implementation is complete when:

- root `scripts/curriculum/` commands cover the normal authoring flow;
- `scripts/curriculum/author-check` is the documented local gate;
- PR CI runs the authoring gate and changed lesson solution tests;
- solution tests support `--changed`, `--jobs`, and JSON output;
- source validation and scaffolding internals are split into focused modules;
- real-world fit has deterministic checks and fixtures;
- runner smoke can be run through one aggregate command;
- docs no longer require authors to remember a multi-step command sequence;
- a new arc can be planned, scaffolded, reviewed, generated, and validated
  without touching generated JSON by hand.
