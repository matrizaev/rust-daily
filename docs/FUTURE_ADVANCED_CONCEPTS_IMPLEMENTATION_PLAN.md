# Future Advanced Concepts Implementation Plan

This plan captures advanced Rust concepts that should be left for future lessons after the lessons 49-90 upgrade. These topics need more harness support, larger examples, or more learner context than the current lesson range should carry.

## Goals

- Avoid overloading lessons 49-90 with concepts that need dedicated setup.
- Keep future lessons idiomatic and production-shaped instead of toy examples.
- Add new dependency sets only when the lesson runner can validate them reliably.
- Prefer capstone-style lessons where judgment matters more than applying one small pattern.

## Concepts Left For Future Lessons

| Concept | Why defer | Future lesson shape |
| --- | --- | --- |
| `sqlx` and real database integration | Needs database setup, schema management, migrations, async runtime behavior, and fixture strategy. | Build a repository backed by SQLite, map DB errors into domain errors, and test with an isolated in-memory database. |
| Performance profiling | Needs a benchmark runner and clear baseline measurements, not normal unit-test validation. | Use `criterion` to compare allocation-heavy and allocation-light designs, then refactor from measurement. |
| `unsafe` boundaries | Needs strict safety contracts and review discipline. It should not appear as a casual implementation trick. | Wrap a tiny unsafe operation behind a safe API, document invariants, and test the safe surface. |
| Procedural macros | Needs a multi-crate workspace and compile-time diagnostics. | Create a derive macro only after learners know when a normal function or `macro_rules!` is enough. |
| Larger crate and API design | Needs multiple modules, public/private boundaries, feature flags, and semver judgment. | Refactor a small library crate while preserving public API behavior. |
| Bigger judgment-heavy refactors | Needs broader code context than one lesson file. | Give learners a messy but working module and ask them to improve cohesion, ownership, errors, and tests without changing behavior. |
| Real service integration | Needs network boundaries, graceful shutdown, config, observability, and error mapping across layers. | Build a small Actix service that composes config loading, request logging, domain validation, persistence, and response mapping. |

## Proposed Future Dependency Sets

### `advanced-db`

Use this for database-backed lessons.

- `sqlx`
- `tokio`
- `thiserror`
- `anyhow`
- `serde`
- `serde_json`

Runner support needed:

- Generate a temporary SQLite database per lesson run.
- Support migrations or inline schema setup.
- Keep tests deterministic and isolated.
- Surface compile errors, migration errors, and runtime DB errors clearly.

### `advanced-perf`

Use this for profiling and benchmark lessons.

- `criterion`

Runner support needed:

- Add a benchmark mode separate from normal `cargo test`.
- Capture benchmark output in a stable enough format for lesson feedback.
- Avoid making exact timing thresholds part of validation.
- Validate qualitative changes such as fewer allocations or simpler ownership only when measurable in a stable way.

### `advanced-macro`

Use this for procedural macro lessons.

- `syn`
- `quote`
- `proc-macro2`
- `trybuild`

Runner support needed:

- Generate a multi-crate workspace with a proc-macro crate and a consumer crate.
- Run compile-pass and compile-fail tests.
- Preserve clear diagnostics in learner feedback.

## Future Arc Candidates

### Database Repository Arc

Teach persistence without leaking database concerns into the domain.

Lessons should cover:

- Defining a repository trait around domain language.
- Implementing the trait with `sqlx` and SQLite.
- Mapping database uniqueness failures into domain-level errors.
- Running isolated tests with temporary schema setup.
- Keeping SQL row structs separate from domain structs.

### Performance By Measurement Arc

Teach optimization as an evidence-driven process.

Lessons should cover:

- Writing a baseline benchmark with `criterion`.
- Identifying avoidable clones and allocations.
- Replacing owned strings with borrowed data where lifetime complexity is worth it.
- Comparing `Vec`, slices, iterators, and maps under realistic inputs.
- Documenting why a faster design is still maintainable.

### Unsafe Boundary Arc

Teach `unsafe` as an encapsulation and contract problem.

Lessons should cover:

- Reading and writing safety comments.
- Keeping unsafe blocks small.
- Exposing a safe public API.
- Testing edge cases through the safe API.
- Rejecting unsafe code when a safe alternative is clear.

### Procedural Macro Arc

Teach macros only after learners have seen enough repetition to justify them.

Lessons should cover:

- Starting with a normal function or trait implementation.
- Using `macro_rules!` when syntax repetition is local.
- Creating a derive macro when boilerplate crosses crate boundaries.
- Testing macro output and compile failures.
- Producing useful compiler errors.

### Crate Design Capstone

Teach API design at a larger scale.

Lessons should cover:

- Organizing modules around stable boundaries.
- Choosing what is public, `pub(crate)`, or private.
- Re-exporting intentionally from `lib.rs`.
- Using feature flags without fragmenting the API.
- Preserving semver-compatible behavior while improving internals.

### Service Integration Capstone

Teach how earlier concepts compose in a real service.

Lessons should cover:

- Loading config.
- Starting an Actix server.
- Injecting shared application state.
- Validating request DTOs.
- Calling domain use cases.
- Persisting through a repository.
- Mapping errors into HTTP responses.
- Emitting structured `tracing` spans and events.
- Shutting down gracefully.

## Implementation Order

1. Add `advanced-db` support and build the database repository arc.
2. Add `advanced-perf` support and build the performance by measurement arc.
3. Add the unsafe boundary arc using mostly `std`.
4. Add `advanced-macro` support and build the procedural macro arc.
5. Add crate design and service integration capstones after enough smaller advanced arcs exist.

This order keeps infrastructure risk controlled: database and benchmark support are independent, unsafe needs review discipline but little tooling, macros need the most workspace machinery, and capstones should wait until the prerequisite concepts are already familiar.
