# Full Curriculum Implementation Plan

## Goal

Implement the full Rust Daily curriculum described in
[`FULL_CURRICULUM_SPEC.md`](FULL_CURRICULUM_SPEC.md).

The implementation should expand Rust Daily from the current 30-lesson MVP into
an ordered 300-500 lesson curriculum that teaches production-quality Rust:
strong domain types, standard conversions, structured errors, structured logs,
clean architecture, async boundaries, and approved crate tracks.

The plan keeps the product simple while the curriculum scales:

- Lessons live in this repository.
- Lessons are presented one by one in authored order.
- Browser checks and backend Cargo validation run together where useful.
- Backend Cargo validation is the authoritative compile/test assessment.
- Final hint level may reveal the canonical solution for the editable part.
- Clippy is not part of grading; authored tests and focused checks are.

## Current Baseline

Already implemented:

- Vite React PWA.
- CodeMirror Rust editor with autocomplete disabled.
- Local lesson JSON with 30 lessons and concept metadata.
- Local draft, progress, completion, streak, and settings storage.
- Ordered daily selector that returns the first incomplete lesson before cycling.
- Structural and self-check browser validation worker.
- Frontend backend validation client.
- Backend `POST /run` endpoint.
- Backend Cargo runner using Podman.
- Backend request validation for `src/lib.rs` and `tests/lesson.rs`.
- Runner image based on `rust:1.95-slim`.
- Content validation script for the current MVP JSON shape.

Important current limits:

- Content is bundled directly from `frontend/src/content/*.json`.
- Lesson schema is single-editable-file first.
- Backend accepts only `src/lib.rs` and `tests/lesson.rs`.
- Backend generates one minimal Cargo workspace per run.
- Approved crate tracks are not yet cached in the runner image.
- Author reference solutions are not represented in the repository.
- Authoring checks do not compile starters or verify solutions.
- Full curriculum content does not exist yet.

## Non-Goals

Do not include these in the full-curriculum implementation:

- User-selectable focus tracks.
- Adaptive scheduling or spaced repetition.
- Accounts or cloud sync.
- AI hints, AI grading, or AI code generation.
- Clippy-driven grading.
- Hidden server-side tests or tamper-resistant scoring.
- General-purpose hosted IDE behavior.
- Arbitrary dependency resolution from submitted code.

## Implementation Strategy

Build the full curriculum in layers:

1. Define taxonomy and backlog.
2. Add schema V2 while keeping MVP lessons compatible.
3. Expand backend validation for multi-file lesson crates and approved dependency sets.
4. Add authoring directories and generation scripts.
5. Migrate and audit the existing 30 lessons.
6. Author the first 60 new lessons.
7. Improve frontend curriculum progress for a larger ordered course.
8. Add crate-specific observability and async tracks.
9. Scale to 300+ lessons in repeatable content waves.

Each milestone should leave the app usable. Avoid a long branch where content,
schema, backend, and frontend all break at once.

## Target Repository Layout

Add a root-level lesson authoring tree:

```text
lessons/
  arcs.json
  concepts.json
  email-address-value-object/
    001-email-address-private-field/
      lesson.json
      starter/
        src/lib.rs
      tests/
        public.rs
      solution/
        src/lib.rs
      notes.md
    002-email-address-tryfrom-str/
      lesson.json
      starter/
        src/lib.rs
      tests/
        public.rs
      solution/
        src/lib.rs
      notes.md
```

Generated frontend content:

```text
frontend/src/content/
  concepts.json
  lessons.json
```

Keep `frontend/src/content/*.json` as the shipped bundle for now. The build
step can continue importing local JSON through Vite until a separate content
bundle is worth the extra complexity.

## Lesson Schema V2

Add a V2 lesson model that supports multi-file lessons, readonly files, public
tests, final-hint solution reveal content, and author-only solution metadata.

Recommended source shape:

```json
{
  "schemaVersion": 2,
  "id": "email-address-tryfrom-str-002",
  "arcId": "email-address-value-object",
  "arcTitle": "Email address value object",
  "order": 32,
  "day": 2,
  "arcLength": 6,
  "title": "Validate EmailAddress with TryFrom",
  "conceptId": "tryfrom-domain-value",
  "difficulty": "medium",
  "estimatedMinutes": 8,
  "scenario": "...",
  "instructions": "...",
  "files": [
    {
      "path": "src/lib.rs",
      "role": "editable",
      "content": "..."
    },
    {
      "path": "tests/public.rs",
      "role": "readonly",
      "content": "..."
    }
  ],
  "hints": [
    {
      "level": 1,
      "body": "Look at where the raw string should be validated."
    },
    {
      "level": 2,
      "body": "This is a fallible conversion, so implement TryFrom<&str>."
    },
    {
      "level": 3,
      "body": "A canonical solution is shown below.",
      "solutionCode": "impl TryFrom<&str> for EmailAddress { ... }"
    }
  ],
  "completionExplanation": "...",
  "validation": {
    "mode": "all",
    "validations": [
      {
        "mode": "structural",
        "timeoutMs": 10000,
        "checks": []
      },
      {
        "mode": "backend-cargo-test",
        "timeoutMs": 10000,
        "dependencySet": "std",
        "testFiles": [
          {
            "path": "tests/public.rs",
            "content": "..."
          }
        ]
      }
    ]
  },
  "author": {
    "solutionPath": "lessons/email-address-value-object/002-email-address-tryfrom-str/solution",
    "notesPath": "lessons/email-address-value-object/002-email-address-tryfrom-str/notes.md"
  }
}
```

Compatibility requirements:

- Existing MVP lessons with `starterCode` must keep loading.
- The frontend should normalize V1 and V2 lessons into one internal display model.
- Existing progress records must remain valid because lesson IDs do not change.
- Generated frontend bundles must exclude full `solution/` directories.
- Generated frontend bundles may include final-hint `solutionCode`.

## Milestone 1: Curriculum Taxonomy And Backlog

### Scope

Define the curriculum spine before writing hundreds of lessons.

### Tasks

- Create `lessons/arcs.json`.
- Move or copy concept source of truth into `lessons/concepts.json`.
- Add concept taxonomy tags:
  - `domain`
  - `conversion`
  - `errors`
  - `logging`
  - `architecture`
  - `async`
  - `testing`
  - `collections`
  - `ownership`
  - `traits`
- Define the first 60-80 new concept IDs.
- Define a first 350-lesson backlog by arc, with rough counts:
  - 12 domain modeling arcs.
  - 8 conversion arcs.
  - 8 structured error arcs.
  - 6 ownership/borrowing arcs.
  - 6 traits/API ergonomics arcs.
  - 6 iterator/collection arcs.
  - 6 testing/documentation arcs.
  - 8 clean architecture arcs.
  - 4 async/side-effect arcs.
  - 4 structured logging/observability arcs.
- Assign each arc an ordered range.
- Map the existing 30 lessons into the same taxonomy.

### Deliverables

- `lessons/arcs.json`.
- `lessons/concepts.json`.
- `docs/FULL_CURRICULUM_BACKLOG.md` with arc list and lesson counts.
- Updated content validator that can check concept tags and arc order.

### Acceptance Criteria

- Every current lesson maps to exactly one concept.
- Every planned concept has tags and prerequisites.
- Every planned arc has a stable ID, title, target lesson count, pillar, and order.
- The full curriculum has a single authored order with no focus-track branching.

## Milestone 2: Schema V2 And Frontend Compatibility

### Scope

Teach the frontend to read V2 lesson bundles without breaking V1 MVP lessons.

### Frontend Changes

Update:

- `frontend/src/types/lesson.ts`.
- `frontend/src/types/validation.ts`.
- `frontend/src/components/LessonScreen.tsx`.
- `frontend/src/components/HintPanel.tsx`.
- `frontend/src/components/CodeEditor.tsx` only if multi-file tabs are needed.
- `frontend/src/validation/validationClient.ts`.
- `frontend/src/validation/backendValidation.ts`.
- `frontend/scripts/validate-content.mjs`.

### Tasks

- Add `LessonFile` type:
  - `path`.
  - `role`: `editable`, `readonly`, or `test`.
  - `content`.
- Add `LessonHint` type:
  - `level`.
  - `body`.
  - optional `solutionCode`.
- Add `schemaVersion`.
- Add optional `order`.
- Support `starterCode` as V1 compatibility.
- Normalize V1 lessons into a V2-like runtime shape:
  - one editable file at `src/lib.rs`.
  - string hints converted to hint objects.
- Render readonly files in a compact readonly panel or tab when present.
- Keep easy lessons single-file in the UI by default.
- Add final-hint solution reveal UI:
  - explicit click to reveal hint 3.
  - display solution code only after the user asks for hint 3.
  - do not auto-reveal after failures.
- Update validation request assembly to include all editable files and lesson test files.
- Keep current progress/draft storage compatible:
  - V1 drafts continue as `src/lib.rs`.
  - V2 drafts store by lesson ID and file path.

### Acceptance Criteria

- Existing 30 lessons render unchanged.
- A fixture V2 lesson with one editable file and one readonly test file renders.
- A V2 lesson with final-hint `solutionCode` reveals it only at hint level 3.
- Existing progress export/import still works.
- `cd frontend && npm run build` passes.
- From `frontend/`, Fallow checks pass:
  - `yes | npx fallow dupes`
  - `yes | npx fallow dead-code`
  - `yes | npx fallow health`

## Milestone 3: Backend Multi-File Cargo Validation

### Scope

Expand backend validation from two fixed paths to controlled multi-file lesson
workspaces while avoiding arbitrary hosted-IDE behavior.

### Backend Changes

Update:

- `backend/src/model.rs`.
- `backend/src/workspace.rs`.
- `backend/src/runner.rs`.
- `backend/src/config.rs`.
- `backend/src/api.rs` if request shape changes.
- `docker/rust-runner.Dockerfile`.
- `docs/BACKEND_SPEC.md`.

### Request Shape

Extend `POST /run` to support:

```json
{
  "dependency_set": "std",
  "files": [
    {
      "path": "src/lib.rs",
      "content": "..."
    },
    {
      "path": "tests/public.rs",
      "content": "..."
    }
  ]
}
```

Keep the old request shape working by defaulting `dependency_set` to `std`.

### Path Policy

Allowed submitted paths:

- `src/lib.rs`.
- `src/**/*.rs`.
- `tests/*.rs`.
- `tests/**/*.rs`.

Rejected submitted paths:

- `Cargo.toml`.
- build scripts.
- dotfiles.
- parent directory traversal.
- absolute paths.
- symlinks.
- non-Rust files unless a future lesson explicitly needs them.

The backend should generate `Cargo.toml` from an approved dependency set. Do not
let submitted code choose arbitrary dependencies.

### Dependency Sets

Initial dependency sets:

- `std`: no external dependencies.
- `serde`: `serde`, `serde_json`.
- `thiserror`: `thiserror`.
- `tracing`: `tracing`, `tracing-subscriber`.
- `tokio`: `tokio`.
- `sqlx`: `sqlx` with a local/offline-friendly feature set only.
- `actix`: `actix-web`, plus the minimum test helpers needed for lessons.
- `backend`: combined set for clean architecture backend slices when needed.

The runner image must pre-cache approved crates so `cargo test --offline` stays
deterministic.

### Runner Image Tasks

- Update `docker/rust-runner.Dockerfile` to prefetch approved dependencies.
- Add one or more template manifests used only to populate the Cargo cache.
- Keep the runtime command as `cargo test --offline --message-format=json`.
- Do not install Clippy for grading.
- Keep network disabled at run time.

### Acceptance Criteria

- Old two-file backend validation requests still pass.
- Multi-file lesson requests pass.
- Unsupported paths return `400`.
- Unsupported dependency sets return `400`.
- Requests cannot provide `Cargo.toml`.
- `cargo test --offline` works for each approved dependency set.
- Backend tests cover path validation, dependency-set validation, workspace assembly, and old request compatibility.
- `make test` passes for the backend.

## Milestone 4: Authoring Pipeline

### Scope

Add repeatable content tooling before producing large lesson batches.

### New Scripts

Add root or frontend scripts:

```text
scripts/curriculum/
  validate-source-content.mjs
  generate-frontend-content.mjs
  check-lesson-starters.mjs
  check-lesson-solutions.mjs
  list-curriculum-coverage.mjs
```

Use Node for consistency with the current frontend content validator.

### Tasks

- Validate `lessons/**/lesson.json`.
- Validate file paths and roles.
- Validate ordered lesson sequence.
- Validate hints:
  - 1-3 hints.
  - hint levels are contiguous.
  - final hint may include solution code.
- Validate concept links and arc links.
- Validate public tests exist for backend-backed lessons.
- Validate author solution paths exist.
- Generate `frontend/src/content/lessons.json`.
- Generate `frontend/src/content/concepts.json`.
- Exclude full `solution/` directories from generated frontend content.
- Include final-hint solution reveal content when authored.
- Check starter compile state:
  - starters should either compile or fail in the expected way.
  - incomplete starters should fail validation when the lesson expects edits.
- Check solution pass state:
  - solution compiles.
  - solution passes public tests.
  - solution passes structural checks when configured.
- Add a curriculum coverage report:
  - lessons by pillar.
  - lessons by difficulty.
  - validation mode coverage.
  - self-check count.
  - backend dependency-set usage.

### Package Scripts

Add or update package scripts:

```json
{
  "scripts": {
    "content:validate": "node scripts/curriculum/validate-source-content.mjs",
    "content:generate": "node scripts/curriculum/generate-frontend-content.mjs",
    "content:check": "node scripts/curriculum/check-lesson-solutions.mjs"
  }
}
```

Keep the existing `frontend/scripts/validate-content.mjs` until the generated
content path fully replaces it.

### Acceptance Criteria

- A new lesson can be authored under `lessons/`.
- Generated frontend JSON is deterministic.
- Author solutions are not shipped except final-hint reveal snippets.
- One command validates metadata and authoring structure.
- One command generates frontend content.
- One command checks starter and solution behavior for all backend-backed lessons.

## Milestone 5: Existing 30-Lesson Migration

### Scope

Move the MVP lessons into the new authoring structure and audit their quality.

### Tasks

- Create `lessons/` entries for all current 30 lessons.
- Preserve existing lesson IDs.
- Preserve concept IDs unless a rename is worth a migration.
- Add author reference solutions for each lesson.
- Add public tests where backend validation is practical.
- Convert brittle structural-only checks to `mode: "all"` when useful:
  - structural shape check.
  - backend compile/test check.
- Keep self-check lessons only where deterministic validation is not fair yet.
- Rewrite hints into the three-level ladder.
- Add final-hint solution reveal content where useful.
- Update completion explanations to explicitly name the idiomatic reason.
- Generate frontend content from authoring source.

### Acceptance Criteria

- Existing user progress still maps to the same lesson IDs.
- Existing 30 lessons remain available in order.
- Every lesson has an author solution.
- Every lesson has a reviewed hint ladder.
- Every backend-backed lesson has public tests.
- `cd frontend && npm run build` passes.
- Backend tests pass.
- Fallow checks pass from `frontend/`.

## Milestone 6: First 60 New Lessons

### Scope

Ship the first post-MVP curriculum expansion: 10 arcs, roughly 60 lessons.

### Required Arc Mix

Include at least:

- 2 domain modeling arcs.
- 2 conversion arcs.
- 2 structured error arcs.
- 1 clean architecture arc.
- 1 structured logging arc.
- 1 testing/documentation arc.
- 1 ownership or iterator judgment arc.

Recommended first arcs:

- Email Address Value Object.
- Service Endpoint Configuration.
- Register User Use Case.
- Order Status State Machine.
- Import Records Pipeline.
- Money and Currency.
- Config Loader Errors.
- Repository Port Error Mapping.
- Structured Request Logging.
- Table-Driven Domain Tests.

### Per-Lesson Requirements

Every new lesson must have:

- stable ID.
- concept ID.
- order.
- one primary concept.
- 5-10 minute estimate.
- starter files.
- public tests when backend-backed.
- author solution.
- three-level hint ladder unless fewer hints are enough.
- final hint solution reveal when appropriate.
- completion explanation.
- validation metadata.
- author notes.

### Acceptance Criteria

- At least 60 new lessons exist in `lessons/`.
- At least 80 percent have backend Cargo validation.
- At least one clean architecture arc is complete.
- At least one structured logging arc is complete.
- No lesson requires Clippy for acceptance.
- Content coverage report shows the intended arc mix.
- Frontend generated content loads all new lessons in authored order.

## Milestone 7: Ordered Curriculum UX

### Scope

Make the larger ordered curriculum navigable without adding focus tracks or an
adaptive scheduler.

### Frontend Changes

Update:

- `frontend/src/progression/selectDailyLesson.ts`.
- `frontend/src/components/DailyHome.tsx`.
- `frontend/src/components/ProgressSummary.tsx`.
- `frontend/src/components/LessonScreen.tsx`.
- possibly add `frontend/src/components/CurriculumProgress.tsx`.

### Tasks

- Select the first incomplete lesson by `order`.
- Stop relying on local date modulo once all lessons are complete.
- Show:
  - current lesson number.
  - total lesson count.
  - current arc.
  - completed arcs.
  - next lesson preview.
- Keep the primary call to action as one lesson.
- Add hash access for QA to any lesson ID.
- Keep extra navigation visually secondary.
- Ensure large lesson counts do not slow startup.

### Acceptance Criteria

- Completing lesson N advances to lesson N+1.
- Progress UI stays useful with 90+ lessons.
- No focus-track selector appears.
- No adaptive scheduling logic is introduced.
- Existing draft recovery works by lesson ID and file path.

## Milestone 8: Crate Tracks And Backend Architecture Lessons

### Scope

Add approved crate tracks from the start, but keep each lesson focused.

### Crate Track Rules

- `serde`: teach DTO boundaries and serialization at adapters.
- `thiserror`: teach boilerplate reduction after manual errors.
- `tracing`: teach structured events, fields, spans, and redaction.
- `tokio`: teach async boundaries, tasks, timeouts, and cancellation.
- `sqlx`: teach repository adapters, not domain logic.
- Actix: teach HTTP adapters and error mapping.

### Tasks

- Add dependency-set fixtures for every approved crate track.
- Add one smoke lesson per dependency set.
- Add one full arc that combines domain/application/adapters/infrastructure.
- Verify runner image cache for every dependency set.
- Add content authoring guidance for framework boundary lessons.

### Acceptance Criteria

- Each approved crate track has at least one validated lesson.
- Domain code in architecture lessons does not import framework/database/runtime crates.
- Backend runner validates all approved dependency-set lessons offline.
- Lesson explanations name the architecture boundary being taught.

## Milestone 9: Scale To 300 Lessons

### Scope

Repeat content waves until the curriculum reaches at least 300 lessons.

### Wave Process

Each wave should add 40-60 lessons.

For each wave:

1. Select arcs from the backlog.
2. Write lesson briefs.
3. Review concept dependencies.
4. Author starters and public tests.
5. Author reference solutions.
6. Add hint ladders and final-hint solutions.
7. Run authoring checks.
8. Generate frontend content.
9. Run frontend build and Fallow checks.
10. Run backend tests and runner smoke checks.
11. Tablet smoke test representative lessons.
12. Merge only after content review.

### Quality Gates

Do not merge a wave unless:

- Every lesson validates against schema.
- Every solution passes.
- Every backend-backed starter fails or passes exactly as expected.
- Every final hint has been reviewed for correctness and concision.
- Self-check lessons are explicitly justified.
- No full author solution directories are included in generated frontend content.
- Curriculum order is deterministic.

### Acceptance Criteria

- At least 300 lessons.
- At least 40 arcs.
- Coverage across all curriculum pillars.
- At least 80 percent behavioral validation.
- All generated content loads in the frontend.
- Build and checks pass.

## Data Migration Plan

### Progress

Progress remains keyed by lesson ID.

Requirements:

- Preserve all existing lesson IDs.
- Do not delete or rename current completions.
- If a lesson must be replaced, create a new lesson ID and leave old progress intact.
- Progress export/import remains backward compatible.

### Drafts

Current drafts store one source string per lesson. V2 drafts need file paths.

Migration:

- When reading an old draft, treat it as `src/lib.rs`.
- When saving a V2 draft, store:

```json
{
  "lessonId": "email-address-tryfrom-str-002",
  "files": {
    "src/lib.rs": "..."
  },
  "updatedAt": "..."
}
```

- Keep old draft deletion working.
- Add cleanup for orphaned drafts only as an explicit user action.

## CI And Validation Commands

For docs-only changes:

```sh
git diff --check -- docs/SPEC.md docs/FULL_CURRICULUM_SPEC.md docs/FULL_CURRICULUM_IMPLEMENTATION_PLAN.md
```

For frontend/schema/content changes:

```sh
cd frontend
npm run build
yes | npx fallow dupes
yes | npx fallow dead-code
yes | npx fallow health
```

For backend changes:

```sh
make format
make lint
make test
```

For runner changes:

```sh
podman build -f docker/rust-runner.Dockerfile -t rust-runner:1.95 .
```

Then run backend validation smoke cases for:

- `std`.
- `serde`.
- `thiserror`.
- `tracing`.
- `tokio`.
- `sqlx`.
- `actix`.

## Release Gates

### First Full-Curriculum Alpha

Ship when:

- Schema V2 works.
- Authoring pipeline exists.
- Existing 30 lessons are migrated.
- First 60 new lessons are authored.
- Backend validates multi-file lessons.
- Approved dependency sets work offline.
- Ordered curriculum UX works for 90+ lessons.

### First Full-Curriculum Beta

Ship when:

- At least 180 lessons exist.
- At least 25 arcs exist.
- All approved crate tracks have working lessons.
- Content coverage report shows balanced pillars.
- Tablet smoke testing covers representative lessons from every pillar.

### Full Curriculum Release

Ship when:

- At least 300 lessons exist.
- At least 40 arcs exist.
- Authoring checks are reliable enough to block merges.
- 80 percent or more of lessons have behavioral validation.
- Remaining self-check lessons are justified.
- Existing users keep drafts and progress.

## Risks And Mitigations

### Risk: Schema Migration Breaks Current Lessons

Mitigation:

- Keep V1 compatibility until all current lessons are migrated.
- Add fixture tests for both V1 and V2 lesson shapes.
- Preserve lesson IDs.

### Risk: Runner Image Becomes Too Large

Mitigation:

- Use dependency sets instead of arbitrary dependencies.
- Add approved crates in stages.
- Measure image size after each crate track.
- Keep standard-library lessons on the `std` dependency set.

### Risk: Multi-File UI Becomes Too Heavy For Tablets

Mitigation:

- Keep most lessons one editable file.
- Show readonly tests separately.
- Add file tabs only when needed.
- Avoid full IDE behavior.

### Risk: Content Quality Drops At Scale

Mitigation:

- Require author solutions.
- Require content review.
- Use coverage reports.
- Author in waves of 40-60 lessons.
- Keep lessons small and one-concept.

### Risk: Architecture Lessons Become Framework Tutorials

Mitigation:

- Keep domain and application code independent.
- Use framework code only at adapter boundaries.
- Validate dependency direction in author review.
- Explain the architecture boundary in completion text.

### Risk: Final Hint Makes Lessons Too Easy

Mitigation:

- Hint 3 requires explicit user action.
- Completion still requires passing validation.
- Final hint explains the idiomatic reasoning, not just code to paste.
- Use progress analytics locally to track high hint reliance later if needed.

## Suggested First Implementation Slice

Start with the smallest slice that proves the new pipeline:

1. Add `lessons/` source layout for one new arc: Email Address Value Object.
2. Add schema V2 TypeScript types and V1 normalization.
3. Add authoring content validator for that one arc.
4. Generate frontend content while preserving current MVP lessons.
5. Add backend multi-file validation for `src/lib.rs` and `tests/public.rs`.
6. Add author solution checks for the Email Address arc.
7. Render final-hint solution reveal.
8. Run frontend build, Fallow checks, backend tests, and one runner smoke test.

This slice exercises the hardest surfaces without committing to hundreds of
lessons before the tooling is stable.
