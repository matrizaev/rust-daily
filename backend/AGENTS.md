## Rust Idioms & Error Handling

- Use the `config` crate for configuration and environment variable parsing. Avoid ad hoc config parsing in application code.
- Prefer idiomatic Rust over ad hoc plumbing: small modules, explicit ownership, narrow traits, `From`/`TryFrom` conversions, and typed request/command/query structs at boundaries. Do not pass raw `String`, `Vec`, or primitive config values deeper than the layer that deserializes or reads them when a domain concept exists.
- Treat Serde request/config structs as boundary DTOs only. Convert them immediately into validated command/domain types such as `ValidatedRunRequest`, `SubmittedPath`, `SubmittedContent`, and typed config wrappers before enqueueing, running, persisting, or applying business rules.
- Model invariants with strong domain types and validated constructors. Invalid aggregate states should be unrepresentable: keep fields private on domain/content aggregates, expose read-only accessors, and provide fallible builder-style methods for changes that must revalidate. Prefer `NonZeroUsize`, `NonZeroU64`, small enums, and newtypes over unchecked primitives for limits, counts, paths, image names, origins, and addresses.
- Keep validation at the conversion boundary. Prefer `TryFrom<RawType>`/`TryFrom<ValidationInput>` or `FromStr` over standalone validation functions that return `()` and leave the original raw value in circulation. After conversion succeeds, downstream functions should accept the validated type and should not revalidate the same invariant.
- Use `thiserror` for new crate-owned error enums unless there is a concrete reason to hand-write `Display`/`Error`. Keep errors near the layer that owns the failure and convert at boundaries with `From`.
- Return `Result<T, LayerError>` from fallible application, runner, persistence, content, and API helpers. Do not collapse internal errors into strings until crossing an external boundary such as HTTP JSON or logs. API errors should preserve typed variants internally and serialize structured payloads such as `{ code, error, details }` at the HTTP boundary.
- Propagate errors idiomatically with `?` when `From`/`#[from]` can express the layer conversion. Use `map_err` or `match` only when adding meaningful context, selecting a distinct semantic variant, translating an external boundary, or observing/recovering from an error locally.
- Express canonical single-input representation conversions with `From`/`Into`, `TryFrom`/`TryInto`, or `FromStr` for text parsing. Keep named mapping helpers when conversion requires additional context, applies workflow policy, or cannot be implemented in the owning layer under Rust's orphan rules.
- Avoid `unwrap`/`expect` in production paths. In tests and proven invariants, include a message that explains the invariant.
- Keep Actix handlers thin: extract inputs, call `ApiService`/application workflows, and map errors. Keep business rules out of handlers.
- Keep application logic generic over persistence traits where practical so Diesel repositories and test fakes stay interchangeable.
- Use Serde at API/config/content boundaries; avoid leaking transport DTOs into domain logic.
- Use structured `tracing` logs with explicit fields such as `%job_id`, `worker_id`, `status`, and `duration_ms`. Avoid preformatted log strings for data that should be queryable. Keep the subscriber machine-readable for backend runtime logs unless there is a concrete local-dev reason to change it.
- Prefer structured tool output over text heuristics. For example, parse `cargo --message-format=json` messages to classify compile errors instead of scanning stdout/stderr with ad hoc substrings.

## Testing Guidelines

After completing code, content, config, migration, workflow, frontend, or API changes, run `make format`, `make lint`, and `make test` before handing back results. If any command cannot be run or fails because of environment constraints, report that explicitly with the failure reason.

For docs-only changes, such as Markdown files under `docs/` or `README.md`/`AGENTS.md`, do not run the full format/lint/test suite unless the docs change includes executable examples, generated docs, build configuration, or code/content behavior changes. If a docs-specific formatter or linter exists, run that instead; otherwise report: `Not run (docs-only change)`.
