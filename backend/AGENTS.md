# Backend Guidelines

## Scope
These instructions apply to `backend/` and backend-adjacent Rust changes that
affect the Actix API, validation service, queue, runner, workspace creation,
configuration, observability, or Docker runner contract.

## Architecture Boundaries
- Keep Actix handlers thin. `api.rs` should extract inputs, call `AppService`,
  and map typed errors to HTTP responses. Do not put queue, runner, workspace,
  or validation policy in handlers.
- Keep application coordination in `service.rs`. Use narrow semantic ports such
  as `RunDispatcher` when that improves tests without exposing Tokio channels or
  infrastructure details.
- Keep request/content invariants in `model.rs`. Submitted paths, content
  limits, compile-fail cases, run modes, and learner outcomes are domain
  concepts, not raw JSON plumbing.
- Keep workspace filesystem writes in `workspace.rs` and Podman/Cargo process
  orchestration in `runner.rs`.
- Keep configuration loading and validation in `config.rs`; use the `config`
  crate for config/environment parsing instead of ad hoc parsing in application
  code.

## Rust Idioms & Domain Types
- Prefer idiomatic Rust over ad hoc plumbing: small modules, explicit
  ownership, narrow traits, `From`/`TryFrom` conversions, and typed
  request/command/query structs at boundaries.
- Treat Serde request/config structs as boundary DTOs only. Convert them
  immediately into validated command/domain types such as `ValidatedRunRequest`,
  `SubmittedPath`, `SubmittedContent`, and typed config wrappers before
  enqueueing, running, persisting, or applying business rules.
- Do not pass raw `String`, `Vec`, primitive config values, paths, origins,
  image names, or limits deeper than the layer that deserializes or reads them
  when a domain concept exists.
- Model invariants with strong types and validated constructors. Invalid states
  should become unrepresentable once conversion succeeds. Prefer
  `NonZeroUsize`, `NonZeroU64`, small enums, and newtypes over unchecked
  primitives for limits, counts, paths, image names, origins, and addresses.
- Keep validation at conversion boundaries. Prefer
  `TryFrom<RawType>`/`TryFrom<ValidationInput>` or `FromStr` over standalone
  validation functions that return `()` and leave raw values in circulation.
- Express canonical single-input representation conversions with `From`,
  `Into`, `TryFrom`, `TryInto`, or `FromStr`. Keep named mapping helpers when
  conversion needs extra context, workflow policy, or orphan-rule workarounds.

## Errors & Observability
- Use `thiserror` for crate-owned error enums unless there is a concrete reason
  to hand-write `Display`/`Error`.
- Keep errors near the layer that owns the failure and convert at boundaries
  with `From`.
- Return `Result<T, LayerError>` from fallible application, runner, workspace,
  configuration, and API helpers. Do not collapse internal errors into strings
  until crossing an external boundary such as HTTP JSON or logs.
- API errors should preserve typed variants internally and serialize structured
  payloads such as `{ code, error, details }` at the HTTP boundary.
- Propagate errors with `?` when `From`/`#[from]` expresses the layer
  conversion. Use `map_err` or `match` only when adding meaningful context,
  selecting a distinct semantic variant, translating an external boundary, or
  observing/recovering locally.
- Use structured `tracing` logs with explicit fields such as `%job_id`,
  `worker_id`, `status`, and `duration_ms`. Avoid preformatted log strings for
  data that should be queryable.
- Prefer structured tool output over text heuristics. Parse
  `cargo --message-format=json` messages to classify compiler/test outcomes.

## Runner & Security Rules
- Submitted Rust is untrusted. Preserve the rootless Podman boundary, disabled
  network, read-only input mount, bounded tmpfs workspace, process/output
  limits, and cleanup behavior unless a task explicitly changes the runner
  contract.
- The backend owns the generated `Cargo.toml`. Reject submitted manifests,
  build scripts, target directories, arbitrary paths, and unsupported runner
  inputs.
- Keep compile-fail validation separate from normal submitted files. Generated
  compile-fail test targets must remain runner-owned.
- Do not add broad dependency sets casually. Call out dependency-set changes in
  PRs and update the runner cache image as needed.

## Testing Guidelines
After backend code, config, runner, Docker, API, or workflow changes, run:

```text
make format
make lint
make test
```

Run `make smoke-runner` for runner/Docker/config changes when Podman is
available. If any command cannot be run or fails because of environment
constraints, report that explicitly with the failure reason.

For docs-only changes under `backend/`, run `git diff --check` and skip the full
backend suite unless executable examples, generated docs, build configuration,
or code behavior changed.
