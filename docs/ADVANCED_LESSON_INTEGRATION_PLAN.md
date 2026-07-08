# Advanced Lesson Integration Plan

This plan covers where advanced Rust topics can fit into lessons 49-90 without repeating the concepts already taught in lessons 1-36. The goal is to keep the curriculum idiomatic, clean, and practical while adding real ecosystem dependencies through an `advanced` dependency set.

## Harness Support

Add dependency-set support before rewriting lessons that rely on ecosystem crates.

1. Add a dependency-set registry.
   - `std`: current behavior with no external lesson dependencies.
   - `advanced`: `serde`, `serde_json`, `thiserror`, `anyhow`, `tokio`, `tracing`, `tracing-subscriber`, `actix-web`, `actix-rt`, `http`, and `proptest`.

2. Update the backend runner.
   - The backend workspace generator currently writes static lesson `Cargo.toml` files.
   - Generate `[dependencies]` from each lesson's declared `dependencySet`.
   - Reject unknown dependency sets early with a clear error.

3. Update the local lesson test harness.
   - The saved harness script should read `dependencySet` from lesson JSON.
   - It should materialize matching dependencies into the temporary lesson crate before running `cargo test`.
   - It should keep `std` lessons dependency-free.

4. Add validation for dependency sets.
   - Lesson content should only use known dependency-set names.
   - The validation should make it obvious which lesson has an unsupported dependency set.

5. Keep heavier tooling out of the first `advanced` set.
   - Defer `sqlx` into a later `advanced-db` set because it needs database setup, migrations, and runtime decisions.
   - Defer `criterion` because it needs a benchmark harness rather than the normal lesson test runner.

## Best Lesson Targets

| Lessons | Arc | Advanced fit |
| --- | --- | --- |
| 49-54 | `dto-conversions` | `serde` and `serde_json` for real DTO boundaries. |
| 55-60 | `collection-wrappers` | Ownership, borrowing, iterator APIs, and lifetime-aware design. |
| 61-66 | `config-loader-errors` | `thiserror` for typed errors and `anyhow::Context` at application boundaries. |
| 67-72 | `boundary-error-mapping` | Public API design, `#[non_exhaustive]`, controlled exports, and crate boundary judgment. |
| 73-78 | `register-user-use-case` | Async Rust, timeout/cancellation mapping, concurrency primitives, and Actix request handling. |
| 79-84 | `structured-request-logging` | `tracing` spans, events, fields, redaction, and request context propagation. |
| 85-90 | `table-driven-domain-tests` | `proptest` and small `macro_rules!` helpers for expressive test cases. |

## Rewrite Plan

### Lessons 49-54: DTO Conversions

Use `serde` to make DTO lessons feel like production Rust instead of hand-built parsing.

- Add `#[derive(Deserialize)]` to inbound DTOs.
- Add `#[derive(Serialize)]` to outbound DTOs.
- Use `serde_json::from_str` in tests and validation.
- Keep domain commands and domain values free of `serde` unless the lesson is explicitly about boundary types.
- Teach the separation between transport DTOs and domain types.

### Lessons 55-60: Collection Wrappers

Keep this arc mostly `std`, but make the ownership and API design sharper.

- Add idiomatic accessors such as `as_slice`, `iter`, `iter_mut`, and `drain` where they fit.
- Teach exact iterator item types, borrowing behavior, and when to return slices instead of `Vec`.
- Avoid exposing inner collections unnecessarily.
- Use wrappers to teach invariants, not just tuple struct syntax.

### Lessons 61-66: Config Loader Errors

Use real error crates while preserving typed errors where they matter.

- Replace manual `Display` and `Error` implementations with `thiserror::Error`.
- Use `#[from]` for mechanical source conversions.
- Use `#[source]` where explicit source tracking is clearer than conversion.
- Use `anyhow::Context` only at the application boundary.
- Avoid teaching `anyhow` as a replacement for domain error types.

### Lessons 67-72: Boundary Error Mapping

Make this arc about API judgment, not just enum matching.

- Add `#[non_exhaustive]` to public error enums when future variants are plausible.
- Use `pub(crate)` constructors where public construction would weaken invariants.
- Teach controlled re-exports from a crate boundary.
- Add a small public API surface lesson that asks learners to decide what should be public.
- Keep mapping functions explicit and boring; clever abstractions are not the point here.

### Lessons 73-78: Register User Use Case

Use async Rust and Actix in a narrow, teachable way.

- Make repository operations async.
- Use `tokio::time::timeout` to map slow operations into a domain or application timeout error.
- Use `Arc<RwLock<_>>` for the in-memory repository when shared mutable state is needed.
- Teach cancellation by showing that dropped futures must not leave partially committed state.
- End with an Actix handler using `actix_web::{web, HttpResponse, Responder}` and explicit status mapping.
- Keep the use case independent from Actix-specific request and response types.

### Lessons 79-84: Structured Request Logging

Move from custom log structs into idiomatic `tracing`.

- Use `info_span!` for request and use-case spans.
- Use structured fields instead of formatted strings.
- Teach consistent field names such as `request_id`, `user_id`, `error.kind`, and `duration_ms`.
- Redact secrets and avoid logging raw credentials or tokens.
- Propagate span context through async calls.
- Test compile behavior and emitted field shape where practical.

### Lessons 85-90: Table-Driven Domain Tests

Keep normal table tests, then add property testing and small macros where they improve clarity.

- Add `proptest` for invariants that are stronger than example tests.
- Keep example-driven table tests for named business cases.
- Add a small `macro_rules!` helper for repeated named table cases.
- Avoid macro cleverness; the macro should make tests easier to scan.
- Teach that property tests complement examples instead of replacing them.

## Deferred Topics

These topics are valuable, but they should not be forced into lessons 49-90 unless the harness is expanded further.

- `sqlx`: add later as an `advanced-db` dependency set, probably using SQLite in-memory.
- `criterion`: add later with a dedicated benchmark runner.
- `unsafe`: make a separate arc with strict safety-comment validation and narrow examples.
- Large crate architecture: reserve for a later capstone where learners can make judgment-heavy refactors across multiple modules.

## Suggested First Slice

Implement this in two phases.

1. Add `advanced` dependency-set support across validation, backend workspace generation, and the saved lesson harness.
2. Rewrite `dto-conversions` lessons 49-54 to use `serde` and `serde_json`.

That first slice proves the dependency plumbing with a low-risk arc, improves the realism of the lessons immediately, and creates a pattern for the later Actix, async, tracing, and property-testing arcs.
