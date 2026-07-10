# Future Advanced Concepts Implementation Plan

## Purpose

This document is the maintained direction for growing Rust Daily from 90 to
500 lessons. It is a roadmap, not a frozen lesson backlog. Exact arc names and
ordering may change as lessons are authored, but the coverage, infrastructure
gates, and quality rules should remain stable.

The next 410 lessons must extend the current curriculum instead of repackaging
lessons 1-90. Existing lessons already establish:

- domain value objects and invariants;
- standard conversions and parsing;
- collection wrappers and iterator surfaces;
- concrete errors, source chains, and boundary mapping;
- DTO separation and Serde basics;
- introductory async ports, timeout handling, shared state, and Actix handlers;
- structured `tracing` fields, spans, redaction, and propagation;
- table tests, documentation tests, property tests, and small declarative
  macros.

Future arcs should assume those skills and use them in larger or deeper
contexts.

Project snapshot validation with one editable artifact is now part of the
product contract. Future infrastructure should build on that model rather than
adding multi-file editing.

## Target

The complete curriculum should contain:

- 500 ordered lessons;
- roughly 75-90 cumulative arcs;
- mostly 5-8 lessons per arc;
- one primary concept per lesson;
- increasingly realistic multi-file project snapshots, and later multi-crate
  runner modes, with one editable artifact per lesson;
- deterministic behavioral validation for every automatable task;
- periodic capstones where judgment matters more than applying one named
  pattern.

Completing the curriculum should prepare a learner to make strong engineering
decisions in production Rust. It cannot replace experience operating,
profiling, reviewing, and evolving real systems.

## Single-Artifact Lesson Model

The future curriculum must not become a browser IDE. Every lesson keeps exactly
one editable artifact even when validation compiles a larger project.

- Supporting Rust modules, manifests, migrations, fixtures, and tests are
  supplied read-only.
- Each day's project snapshot incorporates the previous day's authored
  reference solution.
- A later day may make another file editable while earlier work remains active
  as read-only project code.
- The learner's exact previous submission is not carried forward.
- Capstones are decomposed into a sequence of focused daily edits rather than
  open-ended multi-file refactors.
- The editable artifact may eventually be Rust, `Cargo.toml`, SQL, or another
  supported text format, but there is still only one.

Runner and content infrastructure therefore support multi-file projects, not
multi-file editing. Future runner modes should extend the same rule to
manifests, workspaces, migrations, and other artifact types.

## Prerequisite Work Before Expansion

Before adding lessons 91-500, finish the infrastructure and authoring guardrails
that will prevent curriculum scale from creating avoidable maintenance debt.

1. Add [compile-fail validation](COMPILE_FAIL_VALIDATION_SPEC.md).
   This unlocks serious lessons on advanced ownership, lifetimes, trait bounds,
   object safety, and macro diagnostics. Without it, many advanced Rust lessons
   become textual explanations or force awkward runtime-only checks.
2. Add an authoring scaffolder.
   Provide a command that creates a lesson skeleton with `lesson.json`,
   `starter/`, `solution/`, `tests/`, `notes.md`, dependency set, and editable
   path. Large-scale lesson authoring should not depend on hand-copying JSON
   structures.
3. Strengthen source-content validation.
   Check exactly one editable file, backend-supported paths, final-hint
   solution parity, readonly continuity from the previous lesson, structural
   checks targeting the editable file, and task text that names the editable
   file when it is not `src/lib.rs`.
4. Add a CI quality gate.
   CI should run backend format, lint, and tests; source and generated content
   validation; frontend build; Fallow checks; and lesson solution tests. Full
   solution runs may be nightly if per-change runtime becomes too high.
5. Polish readonly-file UX enough for snapshot-heavy lessons.
   The editable filename header is in place. Readonly support files should stay
   easy to scan, with future improvements such as remembered open panels or
   copy affordances if author review shows friction.
6. Create advanced lesson templates.
   Maintain reusable shapes for owned and borrowed API modules, async service
   ports, Actix boundaries, error mapping, table and property tests, and
   compile-fail lessons once that runner mode exists.
7. Maintain a curriculum review rubric.
   Every new arc should confirm one concept per lesson, task text matching the
   starter exactly, idiomatic reference code, previous solutions as readonly
   context when needed, and no claim that one exercise teaches universally
   perfect Rust.

## Curriculum Roadmap

| Lessons | Phase | Main outcome |
| --- | --- | --- |
| 91-150 | Advanced ownership and API design | Design zero-copy and generic APIs without unnecessary lifetime complexity |
| 151-210 | Async Rust and concurrency | Structure cancellable concurrent work with explicit state and backpressure |
| 211-270 | Testing and reliability | Test public contracts across crates, compile failures, properties, and failure boundaries |
| 271-330 | Persistence and service integration | Compose Actix, SQLx, configuration, serialization, and observability cleanly |
| 331-390 | Crate design and macros | Evolve stable library APIs, workspaces, features, and justified macros |
| 391-450 | Performance and unsafe boundaries | Optimize from evidence and encapsulate systems-level invariants |
| 451-500 | Integration capstones | Refactor and complete larger systems while preserving behavior and boundaries |

## Phase 1: Advanced Ownership and API Design

Lessons 91-150 should deepen ownership rather than repeat basic borrowing,
`Cow`, or `IntoIterator`.

Candidate arcs:

- zero-copy parsers with borrowed output;
- structs with lifetime bounds and multiple related lifetimes;
- API choices among owned values, references, `Cow`, and smart pointers;
- `Box`, `Rc`, `Arc`, `Cell`, `RefCell`, `Mutex`, and `RwLock` by ownership
  requirement;
- interior mutability failure modes and narrow mutation surfaces;
- generic bounds, associated types, and object-safe trait design;
- static versus dynamic dispatch at public boundaries;
- custom iterators with exact ownership and lifetime behavior;
- `HashMap::entry`, ordered collections, and collection choice;
- comparison, hashing, formatting, and operator traits;
- public APIs using `AsRef`, `Borrow`, slices, and iterator parameters;
- small refactors that remove unnecessary clones without making APIs harder to
  use.

Infrastructure needed beyond the current snapshot support:

- compiler diagnostics mapped back to supplied file paths;
- compile-time trait assertion helpers;
- compile-fail cases for invalid borrowing and object-safety examples;
- validation that can distinguish intended API constraints from textual
  implementation details.

## Phase 2: Async Rust and Concurrency

Lessons 151-210 should build beyond the introductory async use-case arc.

Candidate arcs:

- future execution, task ownership, and `'static` boundaries;
- cancellation safety around staged state changes;
- `tokio::select!` and losing-branch behavior;
- timeouts, retries, jitter, and retry classification;
- bounded `mpsc`, `oneshot`, `watch`, and `broadcast` channels;
- semaphores, bounded fan-out, and backpressure;
- shared-state design without holding locks across `.await`;
- task supervision and error propagation;
- graceful shutdown and draining in-flight work;
- async traits, return-position futures, and dynamic dispatch tradeoffs;
- idempotency and duplicate work at service boundaries;
- deterministic concurrency tests.

The runner should keep network access disabled. Service and protocol exercises
should use Tokio primitives and Actix's in-process test support unless a future
sandbox design explicitly permits isolated networking.

Infrastructure needed:

- deterministic time control where appropriate;
- reliable timeout and cancellation test patterns;
- optional concurrency-testing dependencies such as `loom` only after their
  runtime cost is measured;
- clear diagnostics for deadlock-like test timeouts.

## Phase 3: Testing and Reliability

Lessons 211-270 should teach tests as executable API and architecture
contracts.

Candidate arcs:

- integration tests from an external crate perspective;
- test data builders that preserve domain invariants;
- reusable fakes for repository and clock ports;
- custom proptest strategies and shrinking-friendly domain generators;
- compile-pass and compile-fail tests with `trybuild`;
- panic boundaries and `catch_unwind`;
- doctests as public API commitments;
- deterministic tests for time, randomness, and retry policies;
- failure injection at adapter boundaries;
- compatibility tests for serialization and public errors;
- regression tests that reproduce a bug before fixing it;
- review exercises that remove brittle or implementation-coupled tests.

Infrastructure needed:

- workspace and external integration-test layouts;
- compile-fail result support;
- stable fixture and snapshot policies;
- a way to run different Cargo targets without exposing arbitrary commands.

## Phase 4: Persistence and Service Integration

Lessons 271-330 should compose ecosystem crates while keeping the domain clean.

Candidate arcs:

- SQLx repositories using isolated SQLite databases;
- migrations and schema setup;
- database row types separated from domain types;
- uniqueness, not-found, and transient error mapping;
- transaction ownership and rollback behavior;
- environment configuration and typed overrides;
- custom Serde formats at adapter boundaries;
- Actix extractors, application state, middleware, and response mapping;
- request IDs and tracing context across layers;
- metrics and latency/error counters;
- composition roots and dependency wiring;
- graceful startup and shutdown;
- an end-to-end use case through HTTP, application, domain, and persistence.

Infrastructure needed:

- an `advanced-db` dependency set;
- one temporary SQLite database per run;
- deterministic migration support;
- generated multi-file crates;
- in-process Actix service tests;
- no dependency on external databases or network services.

## Phase 5: Crate Design and Macros

Lessons 331-390 should move from function-level APIs to crate-level evolution.

Candidate arcs:

- module organization and dependency direction;
- deliberate `pub`, `pub(crate)`, private items, and re-exports;
- sealed traits and extension points;
- `#[non_exhaustive]` and forward-compatible enums;
- semver-compatible versus breaking API changes;
- Cargo workspaces and package boundaries;
- feature flags without combinatorial API fragmentation;
- optional dependencies and minimal default features;
- declarative macros that remove real repetition;
- macro hygiene, fragments, repetition, and diagnostics;
- procedural derives using `syn` and `quote`;
- compile-pass and compile-fail macro tests;
- choosing a function, trait, derive, or macro based on the problem.

Infrastructure needed:

- an `advanced-macro` dependency set;
- multi-crate workspaces with a `proc-macro` crate and consumer crate;
- `trybuild` or equivalent diagnostic tests;
- feature-matrix validation for selected combinations.

## Phase 6: Performance and Unsafe Boundaries

Lessons 391-450 should teach measurement and contracts, not folklore.

Candidate arcs:

- representative benchmark design with Criterion;
- reading profiles and identifying the actual hot path;
- allocation and clone reduction from measurements;
- data structure and memory layout tradeoffs;
- iterator, slice, and collection performance under realistic inputs;
- batching, buffering, and cache-aware access;
- small unsafe blocks behind safe APIs;
- required `SAFETY` comments and explicit invariants;
- raw pointers, aliasing, and initialization in narrow examples;
- pinning and custom future state where a normal async function is insufficient;
- FFI ownership, error, and string boundaries;
- rejecting unsafe code when a safe design is adequate.

Infrastructure needed:

- an `advanced-perf` dependency set and benchmark runner mode;
- qualitative benchmark comparison without fragile wall-clock pass thresholds;
- optional Miri support for authoring and CI, not necessarily per browser run;
- multi-file FFI fixtures that do not depend on host-specific libraries;
- dedicated review rules for every unsafe lesson.

## Phase 7: Integration Capstones

Lessons 451-500 should use larger codebases and less prescriptive tasks. Each
capstone may span 8-12 lessons while preserving the 5-10 minute daily edit.

Candidate capstones:

- refactor a coupled module into domain, application, and adapter boundaries;
- evolve a public library without breaking downstream callers;
- build an Actix service with typed configuration, validation, SQLx
  persistence, tracing, metrics, and graceful shutdown;
- diagnose and fix a cancellation or concurrency correctness problem;
- profile and optimize a data-processing path while preserving readability;
- wrap a small unsafe or FFI boundary behind a safe tested API;
- review a working but unidiomatic crate and improve it incrementally;
- make tradeoffs among generics, trait objects, ownership, and allocation with
  incomplete information.

Capstones should validate behavior and public contracts while allowing more
than one defensible implementation of the daily file. No capstone lesson should
require coordinated edits across several files. Explanations must discuss
tradeoffs rather than claim one universally perfect pattern.

## Runner and Dependency Roadmap

The current runner supports multi-file snapshots for one generated library
crate and two dependency sets: `std` and `advanced`.

Add capabilities only when a planned arc requires them:

| Capability | Required for |
| --- | --- |
| Multi-crate workspace generation | External API tests and procedural macros |
| Compile-fail mode | Lifetimes, trait bounds, and macro diagnostics |
| `advanced-db` with SQLx and SQLite | Persistence arcs |
| `advanced-perf` with Criterion | Measurement and optimization arcs |
| `advanced-macro` with `syn`, `quote`, `proc-macro2`, and `trybuild` | Procedural macro arcs |
| Feature-matrix runs | Crate feature design |
| Author-only Miri checks | Unsafe lesson review |

Every dependency set must be:

- declared in the lesson schema;
- generated by the backend workspace builder;
- cached in the runner image;
- available offline at runtime;
- reproduced by the local solution harness;
- covered by source and generated-content validation.

Avoid a single unbounded dependency set. Separate sets keep image changes,
lesson capabilities, and supply-chain surface explicit.

## Authoring Process

Implement the remaining curriculum in waves of two or three arcs:

1. Define arc outcomes, prerequisites, and why the arc is not a repeat of the
   existing 90 lessons.
2. Add only the runner capability needed by that wave.
3. Author cumulative starters, tests, solutions, hints, and notes.
4. Run the full source, generated-content, solution, frontend, and backend
   checks.
5. Review every task against its starter and every validation rule against the
   idiomatic solution.
6. Manually complete the arc in the deployed UI.
7. Merge only after the complete arc works; do not ship disconnected lesson
   placeholders.

One primary concept per lesson still applies. Larger examples should grow
through arc continuity instead of turning one lesson into a long coding task.

## Quality Gates

Every future lesson must:

- teach something materially beyond the existing curriculum;
- have a clear task grounded in the visible starter;
- expose exactly one editable artifact;
- compile it with all supplied read-only project files;
- preserve active arc continuity;
- compile and pass deterministic authored tests;
- prefer the idiomatic derive, trait, ownership model, or crate API;
- avoid validation that forces a less idiomatic implementation;
- explain tradeoffs and boundary placement;
- keep the learner edit small even when the surrounding project is larger;
- avoid secrets, uncontrolled networking, and host-dependent behavior;
- pass an arc-level manual browser review.

Every future arc must:

- have a coherent final API or application slice;
- retain earlier behavior through later lessons;
- include at least one review of ownership, errors, tests, and public API;
- avoid teaching a framework convention as if it were a Rust language rule;
- state what remains intentionally outside its scope.

## Implementation Order

1. Complete the prerequisite work before expansion, starting with compile-fail
   validation.
2. Author lessons 91-150 around advanced ownership and API design.
3. Expand async/concurrency validation and author lessons 151-210.
4. Add workspace test modes and author lessons 211-270.
5. Add `advanced-db` and author lessons 271-330.
6. Add multi-crate macro support and author lessons 331-390.
7. Add benchmark and unsafe authoring checks for lessons 391-450.
8. Build capstone workspace support and complete lessons 451-500.

This order makes each infrastructure investment pay for a full curriculum
phase and delays the most expensive runner modes until their prerequisites are
already taught.
