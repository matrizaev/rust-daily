# Rust Daily Product Specification

Status: current implementation and product contract as of July 10, 2026.

## 1. Product

Rust Daily is a local-first Progressive Web App for intermediate Rust
developers. It provides focused 5-10 minute exercises that build fluency in
clear, idiomatic, production-oriented Rust.

The product is for learners who already understand Rust syntax and the basic
ownership model. It is not a beginner tutorial. Lessons use small realistic
APIs, domain types, errors, tests, and application boundaries instead of
algorithm puzzles.

The long-term curriculum target is 500 lessons. The implemented curriculum
contains:

- 90 lessons;
- 15 learning arcs;
- 90 concepts;
- schema V2 source content for every lesson;
- structural browser checks and Cargo-backed tests for every lesson;
- 59 `std` Cargo-test steps and 31 `advanced` Cargo-test steps;
- 30 lessons with backend compile-fail validation, covering 44 public
  compile-fail cases.

The platform supports backend compile-fail validation for single-crate lessons
that need to prove an invalid API use does not compile.

The future curriculum direction is maintained in
[FUTURE_ADVANCED_CONCEPTS_IMPLEMENTATION_PLAN.md](FUTURE_ADVANCED_CONCEPTS_IMPLEMENTATION_PLAN.md).

## 2. Intended Outcome

Rust Daily should help an intermediate developer:

- model domain concepts with meaningful types;
- choose ownership, borrowing, and allocation deliberately;
- use standard traits and conversions as normal API vocabulary;
- design concrete errors and preserve their sources;
- separate domain, application, adapter, and infrastructure concerns;
- write tests and documentation that specify public behavior;
- use async Rust and ecosystem crates without leaking them through every layer;
- recognize when simple, explicit code is better than clever abstraction.

The product teaches habits and judgment. It does not promise perfect code or
replace production experience, profiling, code review, or operating real
systems.

## 3. Positioning

Rust Daily is:

- a daily practice environment for idiomatic Rust;
- an ordered curriculum of cumulative micro-lessons;
- a local-first editor and progress tracker;
- a deterministic validation system backed by authored checks;
- a tablet- and desktop-friendly PWA.

Rust Daily is not:

- a general Rust introduction;
- an algorithm competition platform;
- a replacement for Rustlings;
- an AI tutor or AI grading system;
- a cloud IDE;
- a tamper-resistant certification platform;
- a multi-language runner.

## 4. Product Principles

### 4.1 One Primary Concept

Each lesson has one primary learning objective. Supporting syntax and APIs may
appear, but the task, hints, validation, and explanation must point to the same
concept.

### 4.2 Production-Shaped Rust

Lesson solutions should look like code a reviewer could accept:

- clear names and narrow responsibilities;
- strong types where invariants matter;
- explicit expected failure;
- minimal cloning and allocation;
- borrowed inputs for read-only access where practical;
- standard traits instead of ad hoc equivalents;
- no unnecessary abstraction or macro cleverness;
- no panics in normal library control flow.

An idiomatic derive should be used when deriving is the normal solution. A
manual implementation is appropriate only when its behavior is the lesson.

### 4.3 One Editable Artifact

A lesson may compile a realistic multi-file project snapshot, but exactly one
artifact is editable during that lesson. Multi-crate workspaces are a future
runner mode, not part of the current implementation.

- All other source, manifest, migration, fixture, and test files are supplied
  as read-only context.
- Validation compiles the complete supplied project snapshot.
- A later lesson may make a different file editable.
- When focus moves, the previous day's authored reference solution becomes
  read-only canonical project code.
- Later lessons use authored solutions, not the learner's exact prior
  submission, so valid alternatives and mistakes do not cascade.
- The editable artifact must still fit a 5-10 minute task.

This is a permanent product constraint, not a temporary UI limitation.

### 4.4 Active Arc Continuity

Lessons within an arc evolve one active codebase.

- A later starter begins from the previous lesson's solution.
- Earlier public behavior remains active unless the lesson explicitly teaches
  a migration.
- Prior code must not be hidden in archived modules,
  `previous_lesson_solution`, or `#[allow(dead_code)]` wrappers.
- The task must name APIs that are present in the starter or clearly ask the
  learner to create them.
- Starter code, instructions, tests, hints, and solution must describe the same
  task.

Arcs may be interleaved in the global authored order, but each arc's internal
`day` order remains cumulative.

### 4.5 Deterministic Feedback

Correctness is assessed by authored structural checks and public Cargo tests.
AI is not used to write, grade, or explain a learner's submitted code.

Structural checks provide fast source-shape feedback. Cargo tests are the
authority for compilation and behavior. Tests must check public outcomes
instead of requiring one textual implementation unless syntax is itself the
concept.

### 4.6 Local Ownership

Drafts, settings, attempts, and completions belong to the learner's browser.
No account is required. Progress must remain exportable and importable as
versioned JSON.

### 4.7 Limited Assistance

The editor provides Rust syntax highlighting and normal text-editing commands.
It does not provide autocomplete, AI generation, or IDE diagnostics before the
learner runs validation.

Hints use progressive disclosure:

1. Point toward the relevant code or idea.
2. Name the trait, API, or design move.
3. Optionally reveal the concise authored solution and why it is idiomatic.

Solutions are never revealed automatically after failures.

## 5. Curriculum

### 5.1 Current Arcs

The 90 implemented lessons cover:

| Arc | Lessons | Primary focus |
| --- | ---: | --- |
| `config-service` | 6 | Structs, defaults, validation, and borrowed lookup |
| `parse-user` | 7 | Typed errors, sources, conversions, and parsing |
| `inventory-summary` | 6 | Collections, folds, loops, iteration, and sorting |
| `log-lines` | 5 | Borrowing, lifetimes, matching, `Cow`, and tests |
| `request-api` | 6 | Consuming builders, `Default`, `Result`, and docs |
| `email-address-value-object` | 6 | Private domain values and standard parsing traits |
| `money-value-object` | 6 | Invariants, checked operations, and formatting |
| `host-port-config` | 6 | Strong configuration types and composition |
| `dto-conversions` | 6 | Serde DTOs and domain boundary conversions |
| `collection-wrappers` | 6 | Borrowed, owned, and mutable iterator APIs |
| `config-loader-errors` | 6 | `thiserror`, source chains, and application context |
| `boundary-error-mapping` | 6 | Error translation and public API judgment |
| `register-user-use-case` | 6 | Async ports, shared state, timeout, and Actix boundary |
| `structured-request-logging` | 6 | `tracing`, spans, fields, redaction, and propagation |
| `table-driven-domain-tests` | 6 | Tables, docs, property tests, and small macros |

### 5.2 Sequencing

- Lessons have one global authored `order`.
- The next lesson is the first incomplete lesson in that order.
- Completed lessons may be reopened from the curriculum path.
- After all lessons are complete, daily selection rotates through the
  curriculum.
- Adaptive scheduling, focus tracks, and prerequisite-based unlocking are not
  implemented.

### 5.3 Concept Model

Every lesson references one concept. A concept defines:

- stable ID, name, and description;
- prerequisite concept IDs;
- supported difficulty levels;
- lesson IDs;
- tags;
- a mastery threshold.

Current progress records introduced, practicing, and comfortable states.
Review scheduling and true mastery are reserved in the data model but are not
implemented as product behavior.

## 6. Lesson Contract

Every canonical lesson must define:

- schema version, stable lesson ID, and stable concept ID;
- arc ID, arc title, arc step, arc length, and global order;
- difficulty and 5-10 minute estimate;
- scenario and unambiguous task instructions;
- exactly one editable starter artifact;
- any read-only or public test files needed for context;
- one to three progressive hints;
- a completion explanation;
- structural and Cargo validation;
- optional public compile-fail cases when compile-time API constraints are the
  concept;
- an author-only reference solution;
- author notes explaining the intended idiomatic choice.

Canonical files live under:

```text
lessons/<arc>/<lesson>/
  lesson.json
  notes.md
  starter/<project files>
  tests/<public test files>
  solution/<editable path>
```

The generated frontend content may contain the final hint's approved solution
snippet. It must not expose author notes or the complete authoring solution
directory as runtime content.

### 6.1 Code Standards

Lesson code must:

- compile on stable Rust 1.95 using edition 2024;
- format cleanly with `rustfmt`;
- keep the editable surface small enough for a tablet session;
- avoid unused archived code;
- compile with every supplied read-only project file;
- prefer standard library APIs before adding a crate;
- use the approved dependency set declared by the lesson;
- avoid `unwrap` and `expect` in library paths unless panic behavior is the
  lesson;
- preserve the earlier active API within its arc.

### 6.2 API Standards

- Use private fields and validating construction for meaningful invariants.
- Use `From` for infallible, lossless, unsurprising conversions.
- Use `TryFrom` or `FromStr` for validation and parsing.
- Use references, slices, `AsRef`, or iterators for cheap views.
- Use `Option<T>` for real absence and `Result<T, E>` for expected failure.
- Avoid boolean flags when an enum expresses the state.
- Do not introduce a port trait without a genuine boundary.

### 6.3 Error Standards

- Domain and library errors are concrete typed enums.
- Variants represent programmatically distinct failures.
- `Display` is human-readable and tests do not parse it as state.
- Wrapped lower-level failures preserve `Error::source`.
- `thiserror` may remove mechanical boilerplate after manual error traits are
  understood.
- `anyhow` is limited to application boundaries and must not replace domain
  error contracts.

### 6.4 Async and Architecture Standards

- Keep domain logic independent of Actix, Tokio, Serde, SQL, and logging setup.
- Convert transport DTOs at adapter boundaries.
- Make cancellation and partial-state behavior explicit.
- Keep locks out of long awaits.
- Map timeouts and infrastructure failures into application-level errors.
- Put structured telemetry at application and adapter boundaries.
- Never log secrets, credentials, tokens, or unnecessary personal data.

### 6.5 Test Standards

- Public tests specify behavior and useful API shape.
- Earlier arc behavior remains covered in later lessons.
- Named examples document business cases.
- Property tests complement rather than replace readable examples.
- Narrow structural checks are allowed when the exact trait, signature, or
  construct is the lesson.
- Broad lint output is not a grading mechanism.

## 7. Validation

### 7.1 Browser Checks

Structural checks run in a dedicated Web Worker with source and output limits.
Supported checks cover selected enums, structs, derives, trait implementations,
methods, functions, and required or forbidden snippets.

These checks do not parse or compile Rust. They provide immediate guidance and
must be backed by Cargo tests for compilation and behavior.

The schema reserves `browser-rust`, but no browser Rust compiler is currently
implemented.

### 7.2 Cargo Checks

The frontend submits a complete backend-controlled snapshot:

```text
src/**/*.rs
tests/**/*.rs
fixtures/**
testdata/**
dependencySet
```

The payload must include `src/lib.rs` and at least one `tests/**/*.rs` file.
The Actix backend validates paths and sizes, places the request on a bounded
queue, creates a temporary Cargo workspace, generates `Cargo.toml` from the
selected dependency set, writes all validated files, and runs
`cargo test --offline` in a restricted Podman container.

Supported dependency sets:

- `std`: no external lesson dependencies;
- `advanced`: Serde, serde_json, thiserror, anyhow, Tokio, tracing,
  tracing-subscriber, Actix Web, actix-rt, http, and proptest.

The runner reports passed tests, test failures, compiler errors, timeouts, and
internal failures separately. Cargo metadata is filtered from learner-facing
output, diagnostics are capped, and a full queue returns HTTP 429.

### 7.3 Compile-Fail Checks

Lessons may add `backend-compile-fail` inside an `all` validation block next to
`backend-cargo-test`. Compile-fail cases are public authored files under
`compile_fail/**/*.rs`; they are not editable lesson files and are not part of
the normal project snapshot.

For compile-fail validation, the backend:

1. validates and writes the normal project snapshot;
2. runs `cargo check --offline --lib`;
3. writes each case as a generated integration-test target under `tests/`;
4. runs `cargo check --offline --test <generated-case>`;
5. passes only when every case fails with the expected diagnostic snippets and
   without any forbidden diagnostic snippets.

If the learner's library does not compile, the result is `compile_error`. If a
compile-fail case compiles successfully or fails for the wrong reason, the
result is `failed`.

### 7.4 Validation Limits

Default server limits are:

| Limit | Value |
| --- | ---: |
| JSON request | 300,000 bytes |
| Individual file | 65,536 bytes |
| Submitted files total | 262,144 bytes |
| Queue capacity | 20 |
| Workers | 2 |
| Execution timeout | 10 seconds |
| Combined output | 65,536 bytes |

Paths must be relative, unique, traversal-free, and inside the supported
single-crate allowlist: `src/**/*.rs`, `tests/**/*.rs`, `fixtures/**`, and
`testdata/**`. The API rejects learner-supplied manifests, lockfiles, build
scripts, target directories, benches, examples, migrations, and arbitrary
paths.

Compile-fail case paths are validated separately and must be under
`compile_fail/**/*.rs`; case bytes count toward the total request limit.

### 7.5 Grading Boundary

Public tests are shipped to and submitted by the browser. A caller can alter
them. Rust Daily is therefore a practice tool, not secure certification or
tamper-resistant grading.

## 8. User Experience

### 8.1 Home

The home screen shows:

- the next incomplete lesson;
- arc, concept, difficulty, and estimated time;
- current streak and completion summary;
- the curriculum grouped by arc;
- completed, current, and upcoming states.

### 8.2 Lesson

The lesson screen provides:

- scenario and focused task;
- one editable file and navigable read-only project context;
- expandable read-only files;
- debounced local draft saving and reset;
- progressive hints;
- validation status, failures, and diagnostics;
- completion explanation after success.

Changing code after a run marks the displayed result stale.

### 8.3 Settings and Portability

Settings include theme, editor font size, reduced motion, progress export and
import, progress reset, and draft deletion.

### 8.4 Accessibility and Responsive Use

The app must remain keyboard operable, use semantic controls and visible focus,
respect reduced motion, expose validation state to assistive technology, and
avoid horizontal page overflow. The editor and primary workflow must work on
tablet and desktop layouts.

## 9. Persistence and Privacy

The browser stores:

| Key | Data |
| --- | --- |
| `rust-daily:v1:progress` | Attempts, completions, and concept state |
| `rust-daily:v1:draft:<lesson-id>` | Draft source |
| `rust-daily:v1:settings` | Display and editor preferences |

The backend has no database and no account model. Submitted source exists in a
temporary workspace for the duration of a run and is not intentionally retained
after cleanup.

No secrets, account data, or tokens belong in browser storage or lesson
submissions. Analytics and notifications are not implemented.

## 10. Offline Behavior

The service worker caches the app shell, static assets, and visited lesson
detail records. Offline users can open cached content, edit code, and retain
local drafts and progress.

Cargo validation requires the backend. The current product does not claim
offline compilation.

## 11. Technical and Operational Boundaries

The implementation is divided into:

- a React, TypeScript, Vite, and CodeMirror PWA;
- generated runtime lesson content;
- an Actix and Tokio validation service;
- a rootless Podman Rust runner;
- Nginx and Cloudflare in production.

Detailed component and runtime flows are defined in
[../ARCHITECTURE.md](../ARCHITECTURE.md). Production operation is defined in
[DEPLOYMENT.md](DEPLOYMENT.md).

Configuration is layered from `config/default.yaml`, an environment-specific
YAML file, and `RUST_DAILY_*` environment overrides.

## 12. Quality Gates

A lesson change is complete only when:

- source content validation passes;
- generated content is refreshed and validates;
- exactly one artifact is editable;
- that artifact compiles with the complete supplied project snapshot;
- the authored solution passes its public tests;
- starter, task, tests, hints, solution, and explanation agree;
- continuity with the preceding arc lesson is preserved;
- the reference solution is idiomatic for the concept;
- frontend production build passes;
- affected backend tests and lint checks pass.

Repository validation commands are documented in
[../README.md](../README.md).

## 13. Current Exclusions

Editing more than one artifact in a lesson is a permanent product non-goal.

The current implementation does not include:

- user accounts or cloud synchronization;
- hidden or server-owned grading tests;
- browser-based Rust compilation;
- multi-crate runner transport;
- adaptive review scheduling;
- notifications or analytics;
- databases, migrations, benchmarks, procedural macro workspaces,
  trybuild-style macro diagnostics, FFI, or dedicated unsafe validation;
- large multi-module capstone workspaces.

These are deliberate future increments, not implied current capabilities.
