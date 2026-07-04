## Rust Idioms & Error Handling

- Use the `config` crate for configuration and environment variable parsing. Avoid ad hoc config parsing in application code.
- Prefer idiomatic Rust over ad hoc plumbing: small modules, explicit ownership, narrow traits, `From`/`TryFrom` conversions, and typed request/command/query structs at boundaries.
- Model invariants with strong domain types and validated constructors. Invalid aggregate states should be unrepresentable: keep fields private on domain/content aggregates, expose read-only accessors, and provide fallible builder-style methods for changes that must revalidate.
- Use `thiserror` for new crate-owned error enums unless there is a concrete reason to hand-write `Display`/`Error`. Keep errors near the layer that owns the failure and convert at boundaries with `From`.
- Return `Result<T, LayerError>` from fallible application, runner, persistence, content, and API helpers. Do not collapse internal errors into strings until crossing an external boundary such as HTTP JSON or logs.
- Propagate errors idiomatically with `?` when `From`/`#[from]` can express the layer conversion. Use `map_err` or `match` only when adding meaningful context, selecting a distinct semantic variant, translating an external boundary, or observing/recovering from an error locally.
- Express canonical single-input representation conversions with `From`/`Into`, `TryFrom`/`TryInto`, or `FromStr` for text parsing. Keep named mapping helpers when conversion requires additional context, applies workflow policy, or cannot be implemented in the owning layer under Rust's orphan rules.
- Avoid `unwrap`/`expect` in production paths. In tests and proven invariants, include a message that explains the invariant.
- Keep Actix handlers thin: extract inputs, call `ApiService`/application workflows, and map errors. Keep business rules out of handlers.
- Keep application logic generic over persistence traits where practical so Diesel repositories and test fakes stay interchangeable.
- Use Serde at API/config/content boundaries; avoid leaking transport DTOs into domain logic.

## Testing Guidelines

After completing code, content, config, migration, workflow, frontend, or API changes, run `make format`, `make lint`, and `make test` before handing back results. If any command cannot be run or fails because of environment constraints, report that explicitly with the failure reason.

For docs-only changes, such as Markdown files under `docs/` or `README.md`/`AGENTS.md`, do not run the full format/lint/test suite unless the docs change includes executable examples, generated docs, build configuration, or code/content behavior changes. If a docs-specific formatter or linter exists, run that instead; otherwise report: `Not run (docs-only change)`.
