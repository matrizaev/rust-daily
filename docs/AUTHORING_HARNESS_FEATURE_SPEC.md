# Authoring Harness Feature Specification

Status: initial command-line harness implemented. Root authoring commands,
changed lesson detection, generated parity checks, deterministic real-world-fit
validation, PR quality CI, scaffold dry-runs, and parallel solution checks are
in place. Deeper source/scaffolder module decomposition remains a hardening
task.

## Purpose

The authoring harness should make creating, reviewing, validating, and shipping
new arcs predictable enough that curriculum quality is limited by lesson design,
not by brittle tooling.

The target is not a visual CMS. The target is a dependable command-line
workflow that lets an author move from arc idea to validated lesson sources with
fast local feedback, clear failures, and CI coverage that catches drift before
merge.

## Problem

The current harness is capable, but it will become a bottleneck at 500 lessons:

- source validation, runtime validation, scaffolding, and shared helpers are
  concentrated in large scripts;
- full solution testing is serial and will get slow as the corpus grows;
- CI is deploy-oriented and does not provide a full PR quality gate;
- arc authoring is possible but not guided as one workflow;
- review rules exist, but there is no command that turns them into an authoring
  checklist or report;
- runner smoke checks exist, but they are not wired into a repeatable harness
  gate;
- generated content parity is checked, but authors still need to remember the
  exact command sequence.

Existing script size as of this spec:

| Script | Lines | Concern |
| --- | ---: | --- |
| `frontend/scripts/curriculum/validate-source-content.mjs` | 1758 | source schema, paths, author solution checks, structural continuity |
| `frontend/scripts/curriculum/scaffold-lesson.mjs` | 1049 | CLI parsing, arc/concept registration, scaffold derivation, file writes |
| `frontend/scripts/validate-content.mjs` | 832 | generated runtime content checks |
| `frontend/scripts/curriculum/scaffold-presets.mjs` | 530 | reusable lesson templates |
| `scripts/test-lesson-solutions.sh` | 249 | serial solution compilation and compile-fail checks |

These are acceptable for 90 lessons. They are risky for repeated changes across
410 more lessons.

## Goals

- Make the happy path for adding an arc or lesson explicit and low-friction.
- Keep authoring source files as the canonical content model.
- Preserve the one-editable-artifact lesson contract.
- Enforce real-world, non-contrived lesson design through deterministic
  validation.
- Keep generated runtime content reproducible and easy to verify.
- Run affected lesson validation quickly during normal authoring.
- Keep full-corpus validation available as a manual release/local confidence
  gate.
- Make script internals small enough to change safely.
- Add PR CI gates that match local authoring commands.
- Keep all lesson and runner validation deterministic and offline where
  practical.

## Non-Goals

- No browser-based CMS.
- No multi-file learner editing.
- No AI-generated grading or AI-authored validation.
- No dynamic lesson dependencies that depend on a learner's prior submitted
  code.
- No external services in lesson validation.
- No multi-crate lesson support. The one-editable-artifact model may use
  multi-file single-crate snapshots, but not Cargo workspaces or proc-macro
  companion crates.
- No new runner dependency sets unless a curriculum phase requires them and the
  runner cache contract is updated.

## Primary Workflows

### 1. Plan A New Arc

The harness should support a command that drafts or validates an arc plan before
files are created.

Proposed command:

```text
scripts/curriculum/plan-arc --arc <arc-id> --title <title> --lessons 6
```

Required behavior:

- validate arc ID, title, target lesson count, and intended global order;
- show existing neighboring arcs and concepts;
- create or update `lessons/arcs.json` only with explicit `--write`;
- optionally register concept placeholders with explicit `--register-concepts`;
- emit a review checklist based on `docs/CURRICULUM_REVIEW_RUBRIC.md`;
- reject duplicate IDs and out-of-order arc metadata.

### 2. Scaffold The Next Lesson In An Arc

The existing scaffolder should become the stable lesson creation entrypoint,
with clearer command names and better reports.

Proposed command:

```text
scripts/curriculum/scaffold-lesson --arc <arc-id> --title <title> \
  --concept <concept-id> --difficulty <easy|medium|advanced> \
  --editable <src/path.rs> --preset <preset-id>
```

Required behavior:

- infer the next lesson number, day, global order, and arc length;
- copy previous authored solutions as readonly context when continuity requires
  it;
- create starter, solution, tests, notes, and compile-fail files;
- place `TODO(author):` markers in every author-owned placeholder;
- require one editable artifact;
- require a backend Cargo validation step unless the lesson is explicitly
  self-check;
- print the exact validation commands for the new lesson.

### 3. Review An Arc Or Lesson

The harness should produce a review-oriented report, not only pass/fail output.

Proposed command:

```text
scripts/curriculum/review lessons/<arc-or-lesson>
```

Required report sections:

- concept focus;
- real-world fit;
- starter/task alignment;
- validation alignment;
- solution quality;
- continuity;
- generated content parity;
- required local commands.

The command should exit nonzero for objective failures, including deterministic
real-world-fit checks. It should avoid subjective warnings that cannot be tied
to an explicit rule.

### 4. Validate Changed Work Quickly

Authors should not need to run the whole corpus for one lesson.

Proposed commands:

```text
scripts/test-lesson-solutions.sh --changed
scripts/test-lesson-solutions.sh --jobs 4 lessons/<arc>
scripts/curriculum/validate-changed
```

Required behavior:

- detect changed lessons from Git relative to `origin/main`;
- include a whole arc when arc metadata, concept links, or continuity can be
  affected;
- support `--jobs N` for parallel solution checks with stable output;
- keep full `scripts/test-lesson-solutions.sh lessons` available;
- support machine-readable JSON output for CI summaries.

### 5. Ship With Confidence

One local command should run the normal authoring gate.

Proposed command:

```text
scripts/curriculum/author-check
```

Required behavior:

- run source validation;
- regenerate content or run a dry-run generation parity check;
- run generated content checks and reference checks;
- run affected lesson solution tests;
- print next commands for broader frontend/backend validation when relevant.

## Functional Requirements

### Source Validation

- Keep rejecting unsafe paths, symlinks, unsupported runner paths, duplicate
  files, invalid roles, missing tests, and compile-fail target collisions.
- Keep verifying final hint solution code matches the authored solution.
- Keep verifying author solutions satisfy current and cumulative structural
  checks.
- Add or preserve checks for real-world fit:
  - scenario names plausible project work;
  - task does not switch away from established arc domain types without notes;
  - author notes explain deliberate simplifications.
- Real-world-fit failures are deterministic validation failures, not only
  review checklist reminders.
- Produce grouped errors by lesson ID and file path.
- Include a short "how to fix" hint for common failures.

### Scaffolding

- Split CLI parsing, state derivation, validation, and file writing into
  separate modules.
- Preserve `--force` only for overwriting known placeholder scaffolds. Do not
  overwrite authored content without an explicit failure.
- Support reusable presets, but keep preset output realistic and domain-shaped.
- Add a dry-run mode that prints planned file writes and metadata changes.
- Add a command to list presets with their intended lesson shape and dependency
  set.

### Content Generation

- Keep staged writes and atomic replacement.
- Add a dry-run parity mode that fails if generated files would change.
- Keep content revision deterministic.
- Keep lesson detail IDs path-safe.
- Never require authors to edit generated runtime JSON directly.

### Solution Testing

- Support `std` and `advanced` dependency sets exactly as the runner does.
- Preserve public tests and compile-fail diagnostic matching.
- Add `--changed`, `--jobs N`, `--list`, and `--format json`.
- Keep compile-fail cases isolated and runner-owned.
- Reuse a shared target directory safely for speed.
- Produce stable summaries:
  - lessons checked;
  - tests passed;
  - compile-fail cases passed;
  - elapsed time;
  - first failing lesson and command to reproduce.

### Runner Smoke

- Keep `scripts/play_run.py` cases for pass, fail, compile-error, timeout,
  multi-file, compile-fail, and advanced dependency scenarios.
- Add a smoke aggregate command that runs every smoke case against a configured
  backend URL.
- Add CI or release guidance for when smoke requires Podman or a deployed
  backend.

### CI

Add a PR workflow separate from deployment.

Required PR checks:

- backend format, lint, and tests;
- frontend install, build, test, and Fallow checks;
- source content validation;
- generated content parity;
- generated content checks and reference checks;
- changed lesson solution tests;
- curriculum script unit tests when script files change.

Full-corpus policy:

- CI should keep lesson solution checks PR-scoped to changed work.
- Full-corpus lesson solution checks are manual release/local confidence
  commands, not main-branch or nightly requirements.

Deploy workflow should assume these quality gates already passed, not be the
only broad validation path.

Runner smoke and advanced runner smoke also remain manual release or local
confidence commands, not required nightly/main-branch CI gates.

## Script Refactor Plan

### Source Validation Modules

Split `validate-source-content.mjs` into:

- `schema-shape.mjs`: required fields, unknown fields, scalar types;
- `path-policy.mjs`: safe paths, runner path limits, symlink containment;
- `lesson-files.mjs`: roles, editable count, readonly/test path rules;
- `validation-steps.mjs`: backend, compile-fail, structural step rules;
- `author-solution.mjs`: notes, solution path, final hint parity;
- `continuity.mjs`: arc day/order, cumulative structural checks;
- `review-rules.mjs`: real-world fit and rubric-derived warnings;
- `reporting.mjs`: grouped text and JSON output.

Each module should export small pure validation helpers plus one integration
entrypoint. New authoring commands should live under root `scripts/curriculum/`;
the existing `frontend/scripts/curriculum/` commands may remain as compatibility
wrappers during migration.

### Scaffolder Modules

Split `scaffold-lesson.mjs` into:

- `scripts/curriculum/parse-author-cli.mjs`;
- `scripts/curriculum/read-curriculum-state.mjs`;
- `scripts/curriculum/derive-next-lesson.mjs`;
- `scripts/curriculum/validate-scaffold-request.mjs`;
- `scripts/curriculum/copy-continuity-sources.mjs`;
- `scripts/curriculum/write-scaffold-files.mjs`;
- `scripts/curriculum/scaffold-report.mjs`.

File writes should be separated from request derivation so dry-run output is
trustworthy.

### Shared Helpers

Split `shared.mjs` into:

- constants and paths;
- JSON read/write helpers;
- path safety helpers;
- diagnostic snippet limits;
- source read and containment helpers;
- sorting and duplicate helpers.

Avoid making a new "god shared" module.

## Performance Targets

Targets are guidance, not hard product promises:

| Operation | Target |
| --- | ---: |
| Validate one changed lesson | under 5 seconds |
| Scaffold one lesson dry-run | under 2 seconds |
| Generate 500 lesson runtime content | under 10 seconds |
| Test one `std` lesson solution | under 10 seconds after warm cache |
| Test one changed 6-lesson arc | under 90 seconds after warm cache |
| Full 500 lesson solution sweep with parallelism | under 20 minutes on CI-sized Linux runner |
| PR quality gate excluding full corpus | under 10 minutes |

If these targets are not met, keep the command but document the measured
runtime and bottleneck.

## User Experience Requirements

- Commands should print concise success summaries.
- Failures should name lesson ID, source file, field/path, and exact rule.
- Error output should avoid stack traces for expected authoring mistakes.
- Every non-obvious failure should include the next useful command.
- `--help` should be useful for every authoring command.
- `--format json` should be available for CI-facing commands.
- Dry-run modes should never write files.

## Acceptance Criteria

The authoring harness is ready for high-throughput 500-lesson work when:

- a new arc can be planned, scaffolded, reviewed, generated, and validated using
  documented commands only;
- a single changed lesson can be validated without running the full corpus;
- CI runs the same checks authors run locally;
- full corpus solution testing is parallel or shardable;
- source validation and scaffolding internals are split into focused modules;
- docs and AGENTS files name the same command flow;
- reviewer checklist includes real-world fit and continuity;
- runner smoke can be run as one aggregate command;
- the harness can reject common authoring mistakes before generated content is
  committed;
- docs-only changes remain cheap to validate.

## Rollout Plan

### Phase 1: Command Surface And CI

- Move authoring entrypoints to root `scripts/curriculum/`.
- Add `scripts/curriculum/author-check`.
- Add generated content dry-run parity.
- Add PR workflow with backend, frontend, content, Fallow, and changed lesson
  solution checks.
- Add changed lesson detection to solution tests.

### Phase 2: Parallel Solution Testing And Smoke

- Add `--jobs`, `--list`, and `--format json` to solution runner.
- Add aggregate runner smoke command.
- Add manual full-corpus validation workflow.

### Phase 3: Script Decomposition

- Split source validation modules.
- Split scaffolder modules.
- Split shared helpers.
- Preserve current command behavior while moving code.
- Keep tests around each extracted module.

### Phase 4: Arc Authoring Workflow

- Add arc planning and review commands.
- Add rubric-derived review report.
- Add preset list/report improvements.
- Add deterministic author notes checks for deliberate simplifications and
  real-world fit.

## Decisions

- Changed lesson detection uses `origin/main`.
- CI runs changed lesson solution checks on PRs only. Full-corpus lesson
  solution checks are not required on main or nightly CI.
- Real-world fit is enforced through deterministic validation rules.
- Authoring commands live under root `scripts/curriculum/`.
- Multi-crate lessons are not supported. Future lesson formats may support
  additional single-crate artifact types, but not Cargo workspaces or
  multi-crate runner transport.

## Related Documents

- [Rust Daily Product Specification](SPEC.md)
- [Future Advanced Concepts Implementation Plan](FUTURE_ADVANCED_CONCEPTS_IMPLEMENTATION_PLAN.md)
- [Authoring Harness Implementation Plan](AUTHORING_HARNESS_IMPLEMENTATION_PLAN.md)
- [Curriculum Review Rubric](CURRICULUM_REVIEW_RUBRIC.md)
