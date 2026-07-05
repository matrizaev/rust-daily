# Full Curriculum Expansion Spec

## 1. Purpose

This feature expands Rust Daily from an MVP lesson set into a full curriculum for writing production-quality, idiomatic Rust.

The curriculum should teach learners how to design small, correct Rust APIs with strong domain types, explicit conversions, structured errors, structured logs, and clean architecture boundaries. The goal is not to teach every language feature in isolation. The goal is to make good Rust design feel normal through daily repetition.

Target scale:

- 300-500 total micro-lessons.
- 40-70 learning arcs.
- 5-10 minutes per lesson.
- 3-10 lessons per arc.
- One primary concept per lesson.
- Standard-library foundations plus approved crate-specific tracks from the start of the full-curriculum expansion.

## 2. Product Outcome

After completing the full curriculum, a consistent learner should be able to:

- Model domain concepts with meaningful Rust types instead of primitive strings, booleans, and integers everywhere.
- Design fallible and infallible conversions with `From`, `Into`, `TryFrom`, and `TryInto`.
- Build APIs that make invalid states difficult or impossible to represent.
- Use ownership, borrowing, lifetimes, and allocation intentionally.
- Write structured error types with useful `Display`, `Error`, `source`, and conversion behavior.
- Add structured logs with meaningful fields and spans instead of unstructured string dumps.
- Separate domain, application, adapter, and infrastructure concerns in small Rust modules.
- Keep async, IO, database, web, and serialization details out of domain code.
- Write tests and examples that document behavior and architectural boundaries.
- Recognize when a loop is clearer than an iterator chain, and when a trait implementation is clearer than a custom method.

## 3. Design Principles

### 3.1 Idiomatic Means Boring and Precise

Lessons should teach Rust that a reviewer would accept in production:

- Clear names.
- Small functions.
- Narrow types.
- Explicit error cases.
- Simple ownership.
- Minimal cloning.
- Minimal panics.
- Predictable trait implementations.
- Tests around public behavior.

Do not teach clever code for its own sake. A lesson should prefer readable Rust over dense Rust.

### 3.2 Strong Domain Types First

The curriculum should repeatedly replace weak representations with named types.

Preferred patterns:

- Newtypes for IDs, emails, ports, quantities, durations, percentages, and tokens.
- Enums for finite states and failure modes.
- `NonZero*` types where zero is invalid.
- `Option<T>` for real absence.
- `Result<T, E>` for expected failure.
- Private fields plus validating constructors when invariants matter.
- Accessors that expose intent, not representation.

Anti-patterns to call out:

- `String` for every identifier and status.
- `bool` flags that should be enums.
- Magic sentinel values such as `0`, `-1`, or empty strings.
- Public mutable fields on types with invariants.
- `unwrap` or `expect` in library code outside examples and tests.

### 3.3 Standard Conversions Over Ad-Hoc Helpers

The curriculum should strongly prefer Rust's conversion traits.

Rules:

- Use `From<T> for U` for infallible, lossless, unsurprising conversions.
- Use `TryFrom<T> for U` for conversions that validate or can fail.
- Let `Into` and `TryInto` be used at call sites through the blanket impls.
- Use `AsRef`, `Borrow`, or plain references for cheap views, not ownership-taking helpers.
- Avoid custom methods such as `parse_user`, `from_raw`, or `to_domain` when a standard trait is the actual API being taught.
- Allow named constructors such as `UserId::new` when the method communicates domain intent better than a general conversion.

Lessons should explain why `From` and `TryFrom` improve API consistency: callers can compose conversions, use `?`, and rely on standard Rust vocabulary.

### 3.4 Structured Errors Are Part of the API

Errors are not strings. The curriculum should teach errors as domain and boundary contracts.

Required progression:

- Error enum design.
- Programmatic variants.
- Human-readable `Display`.
- `std::error::Error`.
- Preserving lower-level sources.
- `From` conversions for source errors.
- `?` propagation through typed boundaries.
- Error mapping at architectural boundaries.
- Separating domain errors from transport errors.

Policy:

- Domain and library code should return concrete error enums.
- Application boundaries may map multiple domain errors into use-case errors.
- Binary/application entry points may use broad error wrappers where appropriate.
- HTTP, CLI, and UI adapters should translate errors at the edge.
- Error text should be stable enough for humans but not used as programmatic state.

Crate-specific lessons:

- `thiserror` may be taught after manual `Display` and `Error` implementations are understood.
- `anyhow` may be taught only for application/binary contexts, not domain APIs.

### 3.5 Structured Logs Are Observable Events

The curriculum should teach logs as structured events with fields.

Required progression:

- Replacing `println!` debugging with intentional logging.
- Choosing event names and levels.
- Adding fields such as `request_id`, `user_id`, `order_id`, `attempt`, and `duration_ms`.
- Using spans to connect work across calls.
- Logging errors with context without losing `source`.
- Avoiding secrets, tokens, raw PII, and full request bodies.

Preferred crate track:

- Introduce `tracing` after learners understand basic error and boundary design.
- Teach `instrument`, spans, event fields, and subscriber setup in separate lessons.

Structured logging lessons should avoid building a logging framework. They should focus on where to log, what fields to attach, and how logs support operations without polluting domain code.

### 3.6 Clean Architecture in Small Slices

Clean architecture should be taught through micro-slices, not diagrams alone.

Layer vocabulary:

- Domain: entities, value objects, domain services, domain errors, pure rules.
- Application: use cases, ports, transactions, orchestration, use-case errors.
- Adapters: HTTP handlers, CLI commands, repository implementations, serializers.
- Infrastructure: database clients, filesystems, queues, clocks, network clients.

Rules:

- Domain code must not depend on Actix, SQL, HTTP, JSON, tracing subscriber setup, environment variables, or wall-clock access.
- Application code may depend on domain types and port traits.
- Adapters may translate external DTOs into domain types with `TryFrom`.
- Infrastructure implements ports and performs side effects.
- Boundary conversions must be explicit and tested.

Lesson arcs should use tiny modules to make this visible:

```text
src/
  domain/
  application/
  adapters/
  infrastructure/
```

For early lessons, the same architecture can be shown in one file with module declarations. Later backend-backed lessons can use multiple files.

### 3.7 Approved Crate Tracks From the Start

The full curriculum may include crate-specific tracks from the first post-MVP expansion.

Approved initial crate tracks:

- `serde` for serialization and adapter DTO boundaries.
- `thiserror` for reducing boilerplate after manual error implementations are understood.
- `tracing` for structured logs, spans, and request/use-case observability.
- `tokio` for async runtime, tasks, cancellation, and timeouts.
- `sqlx` for database adapters and repository implementations.
- Actix for HTTP adapters and backend boundary lessons.

These crates should not replace Rust fundamentals. Each crate lesson must still teach one focused Rust or architecture concept, and domain code must remain independent from framework, database, runtime, and serialization details unless the lesson is explicitly about translating at that boundary.

## 4. Curriculum Pillars

### 4.1 Domain Modeling

Concepts:

- Newtypes.
- Private fields.
- Validating constructors.
- Invariant-preserving methods.
- Enum state machines.
- `Option` vs sentinel values.
- `Result` vs boolean validation.
- `NonZeroUsize`, `NonZeroU64`, and related standard types.
- `PhantomData` only in advanced lessons.

Example arcs:

- `UserId`, `EmailAddress`, and `DisplayName`.
- `Money`, `Currency`, and non-negative amounts.
- `Port`, `Host`, and service endpoint configuration.
- `OrderStatus` transitions.
- `Percentage` and bounded values.

### 4.2 Conversion Design

Concepts:

- `From` for wrappers.
- `TryFrom<&str>` for parsers.
- `TryFrom<RawDto>` for validation.
- `FromStr` where string parsing is the public API.
- `IntoIterator` for collection wrappers.
- `AsRef<str>` and borrowed parameters.
- `Cow<'a, str>` for borrowed or owned text.

Example arcs:

- Parse and validate user input into domain types.
- Convert API DTOs into commands.
- Convert domain events into outbound messages.
- Expose collection wrappers idiomatically.

### 4.3 Error Architecture

Concepts:

- Error enum design.
- `Display`.
- `Error`.
- `source`.
- `From` for lower-level errors.
- `?`.
- Error mapping between layers.
- Recoverable vs unrecoverable failure.
- Panic boundaries.

Example arcs:

- Parser error hierarchy.
- Config loader with environment, parse, and validation errors.
- Repository port error mapping.
- HTTP response error translation.

### 4.4 Ownership and Borrowing

Concepts:

- Owned domain types.
- Borrowed view types.
- Function parameters as `&str`, `&[T]`, and `impl Into<String>`.
- Avoiding unnecessary clones.
- Returning borrowed data.
- Lifetime-backed structs.
- `Cow`.
- `Arc` only for shared ownership across async tasks or threads.

Example arcs:

- Log entry views over existing text.
- Search result views into an index.
- Builder APIs with owned final values.
- Read-only domain queries.

### 4.5 Traits and API Ergonomics

Concepts:

- `Debug`, `Clone`, `Copy`, `PartialEq`, `Eq`, `Ord`, and `Hash`.
- Manual vs derived trait implementations.
- `Default`.
- `Display`.
- `From`, `TryFrom`, `FromStr`.
- `Iterator`, `IntoIterator`.
- Associated types.
- Trait bounds that express the minimum required capability.

Example arcs:

- Sortable domain keys.
- Collection wrapper iteration.
- Config defaults.
- Domain event formatting.

### 4.6 Iterators and Collections

Concepts:

- `map`, `filter`, `filter_map`, `flat_map`.
- `collect`.
- `fold` and `try_fold`.
- `find`, `position`, `any`, `all`.
- `HashMap` entry API.
- `BTreeMap` when ordering matters.
- Clear loops when business rules need names.

Example arcs:

- Inventory summaries.
- Deduplicating incoming commands.
- Validating a batch with `try_fold`.
- Grouping events by domain key.

### 4.7 Tests and Executable Documentation

Concepts:

- Unit tests around domain invariants.
- Public behavior tests.
- Error variant assertions.
- Table-driven tests.
- Doc examples.
- Snapshot avoidance for tiny APIs.
- Test data builders.

Example arcs:

- Validate all rejected values for a newtype.
- Assert boundary conversion errors.
- Test clean architecture ports with fakes.
- Write doc examples for a builder.

### 4.8 Clean Architecture

Concepts:

- Module boundaries.
- Domain purity.
- Application use cases.
- Port traits.
- Adapter DTOs.
- Repository implementation boundaries.
- Composition root.
- Error mapping across layers.
- Observability at the application/adapter layer.

Example arcs:

- Register user use case.
- Place order use case.
- Load configuration use case.
- Import CSV records through a validated domain command.

### 4.9 Async Rust and Side Effects

Concepts:

- Async functions as boundary concerns.
- `Send` and `Sync` at task boundaries.
- `Arc` for shared services.
- Cancellation-aware work.
- Timeouts at adapter/application boundaries.
- Avoiding async in pure domain code.
- Mapping async client errors into application errors.

Example arcs:

- Async repository port.
- External client adapter.
- Background retry policy with typed attempts.
- Request-scoped tracing spans.

### 4.10 Observability

Concepts:

- `tracing` events.
- Field names.
- Spans.
- Error context.
- Redaction.
- Metrics-shaped counters without adding a metrics backend.
- Log placement at boundaries.

Example arcs:

- Add request ID and domain ID fields.
- Log validation failure without leaking input.
- Trace a use case across adapter and port calls.
- Convert an error chain into structured diagnostics.

## 5. Lesson Content Contract

Every full-curriculum lesson must include:

- `id`.
- `arcId`.
- `arcTitle`.
- `day`.
- `arcLength`.
- `title`.
- `conceptId`.
- `difficulty`.
- `estimatedMinutes`.
- `scenario`.
- `instructions`.
- `starterCode` or multi-file starter files.
- Up to three hints, where the final hint level may reveal the solution.
- Completion explanation.
- Validation mode.
- Public behavior expectations.
- Author reference solution.
- Author notes explaining why the solution is idiomatic.

The completion explanation must answer one of these questions:

- Why is this type shape stronger?
- Why is this trait the idiomatic API?
- Why is this error/log boundary cleaner?
- Why does this ownership choice avoid unnecessary allocation or lifetime pain?
- Why does this module boundary keep dependencies pointed in the right direction?

### 5.1 Hint and Solution Reveal Policy

The hint system should use a three-level ladder.

Hint 1:

- Give a small nudge toward the relevant code or concept.
- Do not name the complete solution.

Hint 2:

- Name the Rust API, trait, type relationship, or design move that matters.
- May describe the shape of the implementation without giving complete code.

Hint 3:

- May reveal the canonical solution for the editable part of the lesson.
- Should include a short explanation of why that solution is idiomatic.
- Should stay concise enough to fit the micro-lesson format.
- Should be an explicit user action and must not auto-reveal after failures.

The final hint can include solution code in the shipped lesson content. The full
author reference solution directory remains an authoring and validation artifact
and does not need to be shipped wholesale.

## 6. Lesson Quality Standards

### 6.1 Code Standards

Lesson code should:

- Compile on stable Rust.
- Use 2021 or newer edition consistently with the workspace.
- Prefer standard library APIs.
- Avoid macros unless the lesson teaches a macro or derives from a crate track.
- Keep files small enough for tablet editing.
- Use `#[derive(...)]` when deriving is normal production Rust.
- Use manual implementations when the implementation is the concept.

### 6.2 API Standards

Lesson APIs should:

- Prefer typed parameters over primitive bags.
- Prefer borrowed parameters for read-only inputs.
- Prefer `impl Into<String>` for ergonomic owned string setters.
- Prefer `TryFrom` for validation from raw or external data.
- Avoid exposing internal collections directly unless that is the lesson.
- Avoid custom conversion names unless they express domain behavior.

### 6.3 Error Standards

Lesson errors should:

- Be concrete enums for domain/library lessons.
- Have one variant per meaningful failure mode.
- Implement `Display` before being presented to users.
- Implement `Error` when they cross standard error APIs.
- Preserve sources when wrapping lower-level errors.
- Avoid string matching in tests.

### 6.4 Logging Standards

Logging lessons should:

- Use structured fields.
- Put logs at application, adapter, or infrastructure boundaries.
- Avoid logging secrets and raw personal data.
- Avoid using logs as control flow.
- Keep domain code independent from subscriber setup.

### 6.5 Architecture Standards

Architecture lessons should:

- Keep dependency direction explicit.
- Keep domain modules free of frameworks and IO.
- Use traits for ports only when there is a real boundary.
- Avoid over-abstracting tiny pure functions.
- Show conversion code at edges.
- Test domain logic without adapter dependencies.

## 7. Required Schema and Tooling Changes

The existing MVP lesson JSON supports a single `starterCode` string. The full curriculum needs richer content support.

Required additions:

- Multi-file lesson starters.
- Read-only files.
- Editable file list.
- Public test files.
- Author-only reference solution files.
- Author-only explanation notes.
- Three-level hint metadata with optional final solution reveal content.
- Validation mode per lesson and per validation step.
- Concept tags for `domain`, `conversion`, `errors`, `logging`, `architecture`, `async`, and `testing`.
- Lesson review checklist status.

Suggested lesson shape:

```json
{
  "id": "email-address-tryfrom-str-001",
  "arcId": "email-address-value-object",
  "title": "Validate an EmailAddress with TryFrom",
  "conceptId": "tryfrom-domain-value",
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
  "author": {
    "solutionPath": "lessons/email-address-tryfrom-str-001/solution",
    "notes": "..."
  }
}
```

The shipped frontend bundle may include final-hint solution reveal content. It
must not include full author-only solution directories unless a future feature
explicitly requires shipping those files.

### 7.1 Content Repository Policy

The full curriculum lives in this repository.

Reasons:

- Keep product code, lesson schema, validation tooling, and authored lessons versioned together.
- Make schema migrations and content migrations reviewable in one pull request.
- Keep deployment and content bundle generation simple while the authoring pipeline is still evolving.
- Avoid splitting lesson validation contracts across repositories before the full curriculum stabilizes.

If the curriculum later needs a separate repository for release cadence or contributor workflow reasons, that should be treated as a migration project with explicit content versioning, bundle compatibility, and CI checks. It is not part of the current full-curriculum plan.

## 8. Validation Requirements

The full curriculum needs behavioral validation for most lessons.

Validation should keep using the combined model already supported by the lesson
schema: browser-side checks and backend Cargo validation are complementary, not
competing tracks.

Policy:

- Use browser-side validation for fast local checks, structural API-shape checks, offline-capable lessons, and immediate feedback that does not need a native Cargo run.
- Use `backend-cargo-test` for lessons that need to prove the submitted Rust compiles and passes authored tests.
- Treat backend Cargo validation as the authoritative compile/test assessment when it is configured for a lesson.
- Use `mode: "all"` when a lesson benefits from both browser-side checks and backend Cargo tests.
- Use `browser-rust` as an offline-capable compile/test path when that engine exists, but do not make it replace backend Cargo validation for deployed lessons that already use the runner.
- Use `structural` only for simple API-shape checks or as a supplement.
- Use `self-check` only when deterministic automation would be misleading.

Additional validation capabilities needed:

- Multi-file Cargo test assembly.
- Public test files separate from starter code.
- Compile-fail lesson support for targeted compiler concept lessons.
- Trait-bound tests.
- Error-source tests.
- Doctest support or doc-comment static checks.
- Narrow authored anti-pattern checks only when they directly support the lesson concept.
- Validation result mapping that can explain architecture-boundary failures.

Validation must remain authored and deterministic. AI must not grade lesson correctness.

### 8.1 Anti-Pattern Check Policy

The full curriculum should not grade lessons through Clippy output or broad lint warnings. The runner image is focused on compiling code and running authored tests; it does not need Clippy for lesson assessment.

Policy:

- Do not turn lessons into lint puzzles.
- Do not require users to fix warnings by copying what a linter says.
- Prefer authored tests, trait-bound checks, compile checks, and narrow structural checks.
- Use anti-pattern checks only when the anti-pattern is the lesson concept, such as avoiding `unwrap()` in library error handling or avoiding a stringly typed domain status.
- Explain the idiomatic reason in the lesson text, hints, or completion explanation instead of relying on a lint name.
- Keep acceptance tied to the code the learner writes, not to generic style warnings.

## 9. Curriculum Backlog Shape

The first full-curriculum backlog should be planned as arcs, not isolated lesson ideas.

Initial expansion target:

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

This yields roughly 350 lessons at an average of six lessons per arc.

## 10. Curriculum Sequence Policy

The full curriculum should run in a single authored order for now.

Rules:

- Lessons are presented one by one in curriculum order.
- The next lesson is the first incomplete lesson.
- Arcs stay contiguous unless the content author intentionally inserts a short prerequisite or review lesson.
- No user-selected focus tracks are needed for the full-curriculum expansion.
- No adaptive scheduler is needed for the full-curriculum expansion.
- Concept metadata still records prerequisites and tags for progress display, authoring checks, and future scheduling work.

This keeps the product simple while lesson quality, schema V2, backend validation, and authoring tooling are still being built. A future scheduler or focus-track mode should be treated as a separate feature after the ordered curriculum is stable.

## 11. Suggested First Post-MVP Arcs

### 11.1 Email Address Value Object

Lessons:

- Define a private-field `EmailAddress`.
- Add `TryFrom<&str>`.
- Return a typed validation error.
- Implement `Display` for the value object.
- Implement `Display` and `Error` for the validation error.
- Add table-driven tests for accepted and rejected addresses.

### 11.2 Service Endpoint Configuration

Lessons:

- Model `Host`, `Port`, and `Scheme`.
- Use `NonZeroU16` or a validated `Port`.
- Convert raw config with `TryFrom`.
- Use `Default` for local development config.
- Map parse errors into config errors.
- Add doc examples.

### 11.3 Register User Use Case

Lessons:

- Define domain command types.
- Convert an adapter DTO into a command with `TryFrom`.
- Define a repository port trait.
- Implement a use-case function over the port.
- Map domain errors into application errors.
- Add structured tracing fields at the application boundary.
- Keep domain code free of adapter types.

### 11.4 Order Status State Machine

Lessons:

- Replace string statuses with an enum.
- Add transition methods.
- Return typed transition errors.
- Test invalid transitions.
- Implement `Display` for status.
- Serialize only at the adapter edge in a later crate-specific lesson.

### 11.5 Import Records Pipeline

Lessons:

- Define raw row and domain command types.
- Use `TryFrom<RawRow>`.
- Accumulate valid commands and typed row errors.
- Use `try_fold` where appropriate.
- Report row numbers in structured errors.
- Add structured logs around batch import.

## 12. MVP Curriculum Remediation

The existing 30 lessons are a good foundation, but the full-curriculum feature should audit them before adding hundreds more.

Audit checks:

- Ensure all current lessons use the new concept taxonomy.
- Replace brittle structural-only checks with backend or browser Rust tests where practical.
- Add author reference solutions.
- Add public test files for behavior-focused lessons.
- Make conversion lessons consistently use `From`, `Into`, `TryFrom`, and `TryInto` terminology.
- Make error lessons explicitly preserve source errors when that is the concept.
- Mark self-check lessons as temporary if automated validation is feasible later.

Do not rewrite all MVP lessons at once. Use this audit to define a repeatable authoring pipeline.

## 13. Implementation Milestones

### Milestone 1: Curriculum Taxonomy

- Add concept tags for domain modeling, conversions, errors, logging, architecture, async, and testing.
- Define the first 60-80 new concepts.
- Map existing 30 lessons into the taxonomy.
- Create an arc backlog with target lesson counts.

### Milestone 2: Content Schema V2

- Add multi-file lesson support.
- Add editable/read-only file roles.
- Add public test files.
- Add author solution paths.
- Keep old single-file lessons loading through a compatibility path.

### Milestone 3: Authoring Pipeline

- Add authoring lesson directories.
- Add script checks for starter compile state, solution pass state, content schema, and validation metadata.
- Generate shipped frontend lesson bundles.
- Ensure full author-only solution files are excluded from frontend bundles, while approved final-hint solution reveal content may ship.

### Milestone 4: Validation Expansion

- Expand backend-backed validation to multi-file tests.
- Add better result normalization between frontend and backend statuses.
- Add compile-fail or expected-error support if needed.
- Add structural checks only where they reinforce behavior tests.

### Milestone 5: First 60-Lesson Expansion

- Author 10 arcs across domain modeling, conversions, errors, architecture, and tests.
- Use backend Cargo validation for compile/test assessment and browser-side checks where they add useful immediate feedback.
- Review every lesson against the quality checklist.
- Smoke test on tablet and desktop layouts.

### Milestone 6: Observability and Async Tracks

- Add `tracing` lessons.
- Add async boundary lessons.
- Keep domain code synchronous and pure in examples unless the async concept itself is being taught.

### Milestone 7: 300-Lesson Curriculum

- Expand the backlog to roughly 50 arcs.
- Maintain quality gates for every lesson.
- Present lessons one by one in authored curriculum order.
- Add progress views that make completed arcs, current lesson, and upcoming lessons visible.

## 14. Acceptance Criteria

The feature is ready for the first post-MVP release when:

- The full curriculum taxonomy exists and is documented.
- Existing MVP lessons are mapped into that taxonomy.
- Content schema V2 supports multi-file lessons and public tests.
- Authoring checks can verify starters, solutions, and validation metadata.
- At least 60 new lessons are authored and reviewed.
- New lessons consistently teach strong domain types, standard conversions, structured errors, and clean boundaries.
- At least one clean architecture arc is complete end to end.
- At least one structured logging arc is complete end to end.
- At least 80 percent of new lessons have behavioral validation through browser Rust or backend Cargo tests.
- Self-check lessons are explicitly justified.
- The frontend selects the next lesson by authored curriculum order, not by focus-track or adaptive scheduling rules.
- The frontend can still run existing MVP lessons without data loss.
