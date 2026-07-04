# Rust Daily Specification

## 1. Product Summary

Rust Daily is a local-first Progressive Web App for practicing idiomatic Rust in daily 5-10 minute sessions on tablets and desktop browsers.

The app is for intermediate engineers who already know basic Rust syntax and want to become fluent at writing production-quality Rust without AI code generation, autocomplete, IDE hints, or algorithmic puzzle grinding.

The core experience is one byte-sized Rust exercise per day. Each exercise teaches exactly one concept and asks the learner to write or modify a small amount of real Rust code. The frontend can run local browser validation for supported lessons, and the repository now includes an optional Actix backend for Cargo-backed validation in an isolated runner container.

The core PWA must remain usable without AI, accounts, or cloud sync. Backend validation is an optional capability for lessons that need normal Cargo behavior; it must not replace the local-first daily practice loop.

### 1.1 Current Implementation Snapshot

Implemented as of July 4, 2026:

- Repository layout:
  - `frontend/`: Vite, React, TypeScript PWA.
  - `backend/`: Actix backend for optional remote Rust validation.
  - `docker/`: runner image assets.
  - `docs/`: product specs, backend docs, implementation plans.
- Frontend:
  - Dark-first tablet-oriented UI with light/system theme setting.
  - CodeMirror Rust editor with syntax highlighting and no autocomplete extension.
  - Daily home, lesson screen, hints, completion explanation, and validation panel.
  - 30 local lesson records and concept metadata.
  - Local drafts, attempts, completions, streak summary, concept progress, settings, progress export/import, progress reset, and draft deletion.
  - PWA manifest, service worker, offline app shell, install metadata, and GitHub Pages workflow.
  - Frontend validation worker with `structural` and `self-check` modes.
- Backend:
  - Actix service exposing `POST /run`.
  - Typed request validation for exactly `src/lib.rs` and `tests/lesson.rs`.
  - Config-driven queue capacity, worker count, timeout, output cap, runner image, workspace root, JSON limit, and optional CORS origin.
  - Bounded Tokio `mpsc` queue with one-shot responses and fixed worker pool.
  - Per-job temporary Cargo workspace assembly.
  - Podman execution of `cargo test --offline --message-format=json` in a restricted container.
  - Sandbox flags for no network, memory/CPU/PID limits, read-only container filesystem, tmpfs, no-new-privileges, and dropped capabilities.
  - Output capping, compile-error classification from Cargo JSON messages, timeout classification, and structured HTTP error responses.
  - `docker/rust-runner.Dockerfile` based on `rust:1.96-slim`.

Not yet implemented:

- Frontend integration with `POST /run`.
- Browser-compiled Rust validation engine for `browser-rust` lessons.
- Lesson content schema for backend-supplied public tests.
- Backend hosting/deployment workflow.
- Server-side hidden tests or tamper-resistant grading.
- User accounts, cloud sync, persistence beyond local browser storage.
- Full daily scheduler with review due, prerequisites, recent failures, selected focus, and grace-day streak rules.
- Full progress/concept graph screen.
- Notifications/reminders.
- Authoring pipeline with reference solutions, starter compile checks, and solution-pass checks.
- Automated frontend test runner and end-to-end test suite.

## 2. Product Positioning

Rust Daily is:

- A daily practice app for idiomatic Rust.
- A browser-validated micro-lesson system for local/offline-capable lessons.
- An optional Cargo-backed validation system for lessons that need normal Rust tooling.
- A tablet-friendly coding environment with intentionally limited assistance.
- A local-first app that can run without a hosted backend for the core daily loop.
- A long-term concept mastery tool for real-world Rust.

Rust Daily is not:

- A LeetCode-style algorithm platform.
- A general Rust tutorial.
- A replacement for Rustlings.
- An AI tutor or code generation product.
- A full cloud IDE.
- A general hosted judge or remote compiler service.
- A place to build large projects during a session.

## 3. Goals

Primary goals:

- Help users practice idiomatic Rust for 5-10 minutes per day.
- Make every session small enough to complete on a tablet.
- Teach one Rust concept per lesson.
- Validate work deterministically through authored browser checks or the optional backend runner, not with AI grading.
- Reinforce real production Rust patterns over puzzle tricks.
- Build long-term comfort with ownership, traits, errors, iterators, modules, tests, and API design.

Long-term learning outcome:

- After roughly 300-500 micro-lessons, a consistent learner should be comfortable designing and implementing idiomatic Rust code for real-world applications.

## 4. Non-Goals

The app must not:

- Generate code for the user.
- Autocomplete identifiers, syntax, imports, or solutions.
- Use AI to grade correctness.
- Reward long daily sessions.
- Encourage solving many exercises in one sitting as the primary loop.
- Focus on clever algorithms unless the algorithm is incidental to a Rust concept.
- Require local Rust installation on the user's tablet.
- Require a hosted backend for local practice, drafts, progress, or offline lesson viewing.
- Require user accounts or cloud sync for MVP use.
- Depend on large third-party crates for lesson solutions unless a specific advanced lesson intentionally teaches crate usage.

## 5. Target Users

### 5.1 Primary Persona

An intermediate software engineer who:

- Knows at least one programming language well.
- Has learned basic Rust syntax.
- Understands what ownership and borrowing are at a surface level.
- Wants to write more idiomatic Rust.
- Has limited daily time.
- Often uses a tablet away from a full development workstation.
- Does not want AI assistance while practicing.

### 5.2 Secondary Persona

A professional engineer returning to Rust who:

- Has previously used Rust but lacks fluency.
- Wants daily repetition on specific language features.
- Needs small refreshers instead of long tutorials.

## 6. Core Principles

### 6.1 One Concept Per Lesson

Every lesson must focus on exactly one Rust concept.

Examples:

- Define a custom error enum.
- Add one lifetime parameter.
- Implement `Display`.
- Convert a loop into an iterator chain.
- Replace stringly-typed errors with a typed error.
- Add `TryFrom<&str>` for a domain type.

### 6.2 Production-Quality Micro-Code

Lessons should produce small but realistic Rust code:

- Domain models.
- Error types.
- Parser helpers.
- Trait implementations.
- API boundaries.
- Tests.
- Module organization.

Avoid throwaway puzzle framing when a real-world framing is possible.

### 6.3 Deterministic Validation as Judge

Validation must be deterministic and authored. It may run locally in the browser or through the optional backend runner, depending on the lesson's validation mode and deployment.

Supported validation paths:

- Browser-side structural checks for lesson metadata and expected API shape.
- Browser-side self-check lessons when fair automated validation is not available yet.
- A future browser-shipped Rust validation engine where practical.
- Optional backend Cargo validation through the Actix runner for lessons that need normal `cargo test`.
- Authored public tests and examples.

AI must not determine whether a submitted answer is correct.

The core PWA does not require full Cargo compatibility. Lessons that use backend validation must remain small, standard-library-first, and bounded by the runner limits.

### 6.4 No AI, No Autocomplete

The editor must intentionally omit:

- AI chat.
- AI code generation.
- AI rewrite suggestions.
- Identifier autocomplete.
- Import autocomplete.
- Snippet completion.
- Inline ghost text.
- IDE-style quick fixes.

Allowed assistance:

- Syntax highlighting.
- Manual check/test button.
- Reset.
- Authored hints.
- Rust compiler/checker output when supported.
- Lesson explanation after completion.

### 6.5 Daily Constraint

The product should protect the user from overcommitment:

- The default session is exactly one lesson.
- A lesson should take 5-10 minutes.
- The app should not use infinite feeds.
- Extra practice may exist, but it must be secondary to the daily lesson.

## 7. Learning Scope

The curriculum should cover:

- Ownership.
- Borrowing.
- Lifetimes.
- Structs.
- Enums.
- Pattern matching.
- Methods.
- Trait implementations.
- Generic types.
- Associated types.
- Iterators.
- Closures.
- `From`.
- `Into`.
- `TryFrom`.
- `Display`.
- `Error`.
- `Default`.
- `Clone`.
- `Copy`.
- `Debug`.
- `PartialEq`.
- `Ord`.
- `Iterator`.
- `IntoIterator`.
- Parsing.
- API design.
- Module organization.
- Documentation.
- Tests.
- Idiomatic standard library usage.

## 8. Curriculum Model

### 8.1 Concept Graph

Curriculum progression is a directed concept graph rather than a fixed linear course.

Each concept has:

- Prerequisites.
- One or more lessons.
- Mastery criteria.
- Review intervals.
- Related concepts.

Example:

```text
Structs
  -> Methods
  -> Trait implementations
  -> Parsing
  -> Error handling
  -> API design
```

### 8.2 Concept Node

Each concept node contains:

- Stable concept ID.
- Display name.
- Description.
- Prerequisite concept IDs.
- Difficulty range.
- Lesson IDs.
- Tags.
- Mastery threshold.

Example:

```json
{
  "id": "trait-display",
  "name": "Display",
  "description": "Implement human-readable formatting for domain types.",
  "prerequisites": ["traits-basic", "formatting-basic"],
  "difficulty": ["easy", "medium"],
  "lesson_ids": ["display-user-error-001", "display-user-error-002"],
  "tags": ["traits", "errors", "formatting"],
  "mastery_threshold": 3
}
```

### 8.3 Difficulty Levels

Every lesson belongs to one difficulty level:

- Easy: small mechanical implementation, one clear path, minimal API design.
- Medium: requires choosing between a few idiomatic options.
- Advanced: requires design judgment, stricter edge cases, or more subtle type reasoning.

All difficulty levels must still fit within 10 minutes.

### 8.4 Mastery

Mastery is tracked per concept.

Inputs:

- Lesson completed.
- Number of failed validation attempts.
- Hint usage.
- Time spent.
- Review completion.
- Recency.

Mastery states:

- Locked.
- Introduced.
- Practicing.
- Comfortable.
- Review due.
- Mastered.

Hint usage should not punish the user harshly, but repeated reliance on high-level hints should delay mastery.

### 8.5 Learning Arcs

Lessons may build on previous lessons, but only inside a short learning arc.

An arc is a 3-10 lesson sequence around one tiny domain or API slice. Each daily lesson adds one concept to the same small piece of Rust. At the end of the arc, the learner has a finished micro-artifact rather than a partially completed long project.

Arc rules:

- Each arc has a clear domain, start point, and end point.
- Each lesson in the arc must remain completable in 5-10 minutes.
- The editable codebase must stay small enough for tablet use.
- The final arc lesson should leave behind a coherent Rust module, mini-crate, or API slice.
- After an arc finishes, the next arc should start fresh or reuse only concepts, not a growing codebase.

Example arc outputs:

- A typed parser with a domain type, parse error, conversion impls, and tests.
- A small configuration loader API.
- An iterator adapter with examples and tests.
- A lifetime-backed view type.
- A builder-style API for a small struct.
- A focused error hierarchy for one module.

The long-term product result is a local workbook of tiny completed Rust artifacts.

## 9. Lesson Model

### 9.1 Lesson Requirements

Each lesson must:

- Teach exactly one concept.
- Fit in 5-10 minutes.
- Use realistic Rust code.
- Prefer the standard library.
- Have a clear success condition.
- Include browser-runnable validation checks or public tests.
- Include at least one authored explanation.
- Include up to three authored hints.
- Avoid requiring autocomplete.
- Avoid requiring external research during the session.
- Stay within the frontend validation subset.

### 9.2 Lesson Anatomy

A lesson contains:

- ID.
- Title.
- Concept ID.
- Difficulty.
- Estimated duration.
- Scenario.
- Instructions.
- Starter files.
- Editable file list.
- Read-only file list.
- Public tests.
- Browser validation mode.
- Validation checks.
- Hints.
- Completion explanation.
- Follow-up concept links.

Example:

```yaml
id: error-enum-parse-user-001
title: Design a parse error enum
concept_id: enums-error-design
difficulty: easy
estimated_minutes: 7
scenario: A small user parser needs a typed error instead of string errors.
instructions: Define the ParseUserError enum with variants for missing fields.
editable_files:
  - src/lib.rs
readonly_files:
  - tests/public.rs
validation:
  mode: browser-rust
  supports_offline: true
  checks:
    - compiles
    - public_tests_pass
    - implements_display
hints:
  - Look at the cases the parser has to report.
  - Each distinct failure mode should usually become a distinct enum variant.
  - Error enums often start simple and gain Display/Error implementations later.
```

### 9.3 Lesson File Layout

Each lesson should be stored in an author-friendly format that can produce a static browser lesson bundle.

Recommended structure:

```text
lessons/
  error-enum-parse-user-001/
    lesson.yml
    author/
      Cargo.toml
      src/
        lib.rs
      tests/
        public.rs
    solution/
      src/
        lib.rs
    browser/
      files.json
      validation.json
```

The `author/` directory keeps lessons easy to test with normal Rust tooling during content creation. The `browser/` directory is the static bundle shipped to the PWA. The solution directory is for authoring and internal validation only; it must not be shipped unless a future solution reveal feature explicitly requires it.

### 9.4 Starter Code

Starter code should be minimal but realistic.

Rules:

- Include enough context to make the task clear.
- Do not include unrelated scaffolding.
- Use `todo!()` or comments only where the learner must act.
- Keep the editable area small.
- Prefer a single editable file for easy and medium lessons.

### 9.5 Public Tests

Public tests should:

- Show the expected behavior.
- Cover the important behavior for the lesson.
- Teach through examples.
- Be readable on a tablet.

### 9.6 Browser Validation Checks

Browser validation checks should:

- Prevent hardcoded answers.
- Check edge cases.
- Check trait bounds when relevant.
- Check API shape when relevant.
- Remain deterministic.

Browser validation checks must not:

- Require network access.
- Depend on wall-clock time.
- Depend on nondeterministic ordering unless the lesson teaches ordering.
- Use excessive compile time.

Because all frontend validation assets are shipped to the browser, checks can be hidden from the main UI but must not be treated as secret or tamper-proof.

## 10. Exercise Types

### 10.1 Fill Missing Code

The learner fills in a small missing implementation.

Example:

```rust
impl Display for ParseUserError {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        // TODO
    }
}
```

### 10.2 Design a Struct

The learner defines fields and types for a small domain object.

Example:

```text
A user has an id, name, and email. Design the struct.
```

### 10.3 Implement a Trait

The learner implements a standard trait.

Examples:

- `Default`.
- `Display`.
- `Error`.
- `From`.
- `TryFrom`.
- `Iterator`.
- `IntoIterator`.

### 10.4 Refactor to Idiomatic Rust

The learner transforms beginner Rust into more idiomatic Rust.

Examples:

- Replace repeated `match` boilerplate with `?`.
- Replace string errors with a typed error.
- Replace manual loops with iterator combinators where clearer.
- Replace unnecessary clones with borrowing.

### 10.5 Find and Fix the Bug

The learner receives code with a focused Rust issue.

Examples:

- Ownership move error.
- Borrow checker conflict.
- Incorrect lifetime placement.
- Overly restrictive type signature.

The lesson must isolate one issue and avoid becoming general debugging.

### 10.6 API Design

The learner chooses a small API surface.

Example:

```text
How should Config::load() return errors?
```

Validation may inspect function signatures, trait implementations, and behavior.

### 10.7 Lifetime Micro-Exercise

The learner adds or adjusts a minimal lifetime.

Example:

```text
Add exactly one lifetime parameter so the returned value can borrow from the input.
```

### 10.8 Iterator Exercise

The learner converts between loop and iterator forms.

Examples:

- Convert a manual collection loop to `filter_map`.
- Replace an unclear iterator chain with a clear loop.

The app should teach judgment, not always prefer iterator chains.

### 10.9 Error Design

The learner designs custom error hierarchies.

Examples:

- Add error variants.
- Implement `Display`.
- Implement `Error`.
- Implement `From<ParseIntError>`.
- Use `source()`.

### 10.10 Ownership Choice

The learner chooses between ownership strategies.

Examples:

- `String`.
- `&str`.
- `Cow<'a, str>`.
- `Rc<String>`.
- `Arc<String>`.

The lesson must explain the tradeoff through code.

## 11. Example Multi-Day Arc

The product should support arcs where each day adds one concept to the same small domain.

Example: parse a user from text.

Arc outcome:

```text
user_parser/
  User struct
  ParseUserError enum
  Display impl
  Error impl
  From<ParseIntError> impl
  TryFrom<&str> for User impl
  public examples/tests
  short docs
```

Day 1:

```rust
enum ParseUserError {}
```

Task: define a custom error enum.

Day 2:

Task: add variants for missing ID, missing name, and invalid ID.

Day 3:

Task: implement `Display`.

Day 4:

Task: implement `std::error::Error`.

Day 5:

Task: implement `From<ParseIntError>`.

Day 6:

Task: implement `TryFrom<&str>` for `User`.

Day 7:

Task: write tests for success and failure cases.

Each day should be independently completable in under 10 minutes.

The arc is complete when the artifact is coherent and usable on its own. The next arc should start from a new small domain rather than continuing to expand this parser indefinitely.

## 12. Validation System

### 12.1 Validation Source of Truth

The validation source of truth is the lesson's configured validation mode.

Current frontend modes:

- `structural`: inspect the submitted source for expected declarations, signatures, or traits.
- `self-check`: ask the learner to compare against public expected behavior and mark completion manually.
- `browser-rust`: reserved for a browser-shipped Rust compiler/checker/test runner; not implemented yet.

Current backend mode:

- `backend-cargo-test`: send `src/lib.rs` and `tests/lesson.rs` to the Actix backend, enqueue a job, and run `cargo test --offline --message-format=json` inside the Podman runner.

The preferred long-term mode for strong Rust behavior checks is either `browser-rust` for offline-capable lessons or `backend-cargo-test` for lessons that need normal Cargo behavior. `structural` and `self-check` remain fallbacks for concepts where automated validation would be unfair or too brittle.

The backend service is implemented, but the frontend does not yet call it. Current product validation remains frontend worker based.

### 12.2 Validation Flow

Current frontend flow:

1. User edits code.
2. User taps Check or Run Tests.
3. Client loads the lesson validation bundle from local cache.
4. Client sends the edited files to a Web Worker.
5. The worker runs the configured frontend validation mode.
6. The worker returns structured diagnostics.
7. Client shows compile/check errors, test failures, or success.
8. Client records completion locally when validation passes or when a self-check lesson is manually completed.

Planned backend-backed flow:

1. User edits code.
2. User taps Check or Run Tests.
3. Client combines the user's `src/lib.rs` with the lesson-authored `tests/lesson.rs`.
4. Client sends a `POST /run` request to the configured backend.
5. Backend validates paths, file count, file sizes, and total submitted bytes.
6. Backend enqueues the run in a bounded queue.
7. A worker creates a temporary Cargo workspace and runs the Podman sandbox.
8. Backend returns a structured `RunResult`.
9. Client maps the result to the validation panel and records completion locally when appropriate.

### 12.3 Validation Result Schema

```json
{
  "status": "failed",
  "kind": "test_failure",
  "duration_ms": 842,
  "summary": "1 public test failed",
  "diagnostics": "...",
  "failed_tests": [
    {
      "name": "parses_valid_user",
      "message": "assertion failed"
    }
  ]
}
```

Possible statuses:

- `passed`.
- `failed`.
- `compile_error`.
- `timeout`.
- `timed_out`.
- `unsupported`.
- `manual_review_required`.
- `internal_error`.

Frontend validation currently uses `timeout`; backend `RunStatus` currently serializes timeout as `timed_out`. The frontend/backend integration should normalize this naming before exposing backend results in the shared UI.

### 12.4 Browser Limits

Validation must enforce:

- Worker timeout.
- Maximum output size.
- No network access.
- Maximum source size.
- Maximum validation bundle size.
- Main-thread responsiveness.

Initial limits:

- Check/test timeout: 10 seconds.
- Output: 64 KB.
- Source upload per lesson: 256 KB.
- Validation engine cache budget: 50 MB initial target.

These limits can be tuned after measuring real tablet performance.

### 12.5 Backend Runner Limits

Current backend defaults:

- Queue capacity: 20.
- Workers: 2.
- Job timeout: 10 seconds.
- Max returned output: 64 KB.
- Max files per request: 8.
- Max single file size: 64 KB.
- Max total submitted content: 256 KB.
- Max JSON payload: 300 KB.
- Allowed submitted paths: `src/lib.rs` and `tests/lesson.rs`.
- Runner image: `rust-runner:1.96`.
- Workspace root: `/tmp/rust-daily-runs`.

Backend runner behavior:

- Creates a temporary workspace per job.
- Writes a generated `Cargo.toml`.
- Writes submitted `src/lib.rs` and `tests/lesson.rs`.
- Runs Podman with no network and resource limits.
- Runs `cargo test --offline --message-format=json`.
- Parses Cargo JSON compiler messages to distinguish compile errors from test failures.
- Caps combined stdout/stderr output and appends an output-truncated marker when needed.
- Cleans up temporary workspaces after each run.

### 12.6 Backend API

Current endpoint:

```text
POST /run
```

Request:

```json
{
  "files": [
    {
      "path": "src/lib.rs",
      "content": "pub fn answer() -> u64 { 42 }\n"
    },
    {
      "path": "tests/lesson.rs",
      "content": "#[test]\nfn answer_is_42() { assert_eq!(rust_daily_lesson::answer(), 42); }\n"
    }
  ]
}
```

Response:

```json
{
  "status": "passed",
  "stdout": "...",
  "stderr": "",
  "duration_ms": 842
}
```

HTTP behavior:

- `200 OK`: job ran; test failure is represented by `status`.
- `400 Bad Request`: invalid JSON or non-limit validation error.
- `413 Payload Too Large`: JSON/file/count/content limit exceeded.
- `429 Too Many Requests`: queue full.
- `500 Internal Server Error`: queue unavailable, worker dropped, Podman spawn failure, or workspace failure before a normal result can be produced.

### 12.7 Security Requirements

The app executes user-provided code or code-like input either in the browser worker or in the backend runner and must isolate validation from the UI and host.

Browser requirements:

- Run validation inside a Web Worker.
- Terminate the worker on timeout.
- Avoid exposing browser APIs to compiled user code.
- Use a strict Content Security Policy.
- Store drafts and validation results locally.
- Keep validation deterministic.

Backend requirements:

- Run submissions only inside the configured Podman runner.
- Do not invoke a shell to construct runner commands.
- Disable container networking.
- Apply memory, CPU, PID, read-only filesystem, tmpfs, no-new-privileges, and capability-drop restrictions.
- Use bounded queues and timeouts.
- Reject unsafe paths and oversized requests before enqueueing.
- Treat backend validation as practice feedback, not tamper-resistant grading, until server-side test selection or signed bundles exist.

### 12.8 Frontend Validation Constraints

Lessons must avoid validation requirements that need a normal native Rust project.

MVP lessons should avoid:

- External dependency resolution.
- Build scripts.
- Proc macros.
- File system access.
- Network access.
- Long-running tests.
- Platform-specific behavior.
- Large multi-module projects.

### 12.9 Cargo Compatibility for Authors

Lesson authors may maintain normal `Cargo.toml`, `src/`, and `tests/` files for authoring quality. A build step converts supported lessons into browser validation bundles.

Backend-backed lessons may also send authored public tests to `POST /run`. The first backend-backed content format should keep tests explicit and client-supplied; future scored or credentialed features need a stronger trust boundary.

## 13. Offline Behavior

Rust Daily is a local-first PWA and should work after the app shell, lesson content, and frontend validation assets have been cached.

### 13.1 Offline Must-Haves

When offline, the user can:

- Open the app shell.
- View cached daily lesson content.
- Edit cached lesson code.
- Save drafts locally.
- Read cached hints.
- Read cached explanations for completed lessons.
- View cached progress.
- Run cached browser validation for supported lessons.

### 13.2 Offline Limitations

The first app load requires network or local file hosting so the browser can fetch the app bundle.

When a validation engine or lesson bundle is not cached:

- The Check or Run Tests button should explain that the validation asset is unavailable.
- The draft must still be editable and saved.
- The app should fetch the missing asset next time it is online.
- Drafts must not be lost.

Backend-backed `cargo test` validation is unavailable offline unless the backend is reachable on the local network or same device. Lessons that require backend validation must show a clear unavailable/offline state and preserve drafts.

### 13.3 Validation Asset Caching

Validation assets should be cached deliberately:

- Cache the current daily lesson.
- Cache the next few unlocked lessons when reasonable.
- Cache the browser validation engine separately from lesson content.
- Avoid large surprise downloads on mobile connections.

## 14. Editor Requirements

### 14.1 Allowed Features

The editor may include:

- Rust syntax highlighting.
- Monospace font.
- Line numbers.
- Basic indentation.
- Bracket matching.
- Manual undo/redo.
- Manual find.
- Touch-friendly selection behavior.

### 14.2 Disallowed Features

The editor must disable:

- Autocomplete.
- Inline completions.
- Code actions.
- Import suggestions.
- Snippet suggestions.
- AI integrations.
- LSP diagnostics before running tests.
- Automatic formatting that changes user intent during typing.

### 14.3 Optional Features

Optional features:

- Format button using `rustfmt`.
- Vim/emacs keybindings on desktop only.
- Font size control.
- High contrast mode.

If `rustfmt` is included, it must be a deliberate user action, not automatic.

## 15. Hint System

Each lesson may provide up to three hints.

Hint 1:

- Small nudge.
- Points at the relevant code area.
- Does not name the full solution.

Hint 2:

- References a Rust concept or standard library item.
- May suggest a direction.
- Does not provide complete code.

Hint 3:

- Explains the concept.
- May describe the shape of the solution.
- Still should not reveal the full answer unless the lesson is already failed repeatedly and the product explicitly supports solution reveal.

Solution reveal:

- Not part of MVP.
- If added later, it should end the active attempt and mark the lesson as reviewed, not independently solved.

## 16. User Experience

### 16.1 Daily Home

The first screen should show:

- Today's lesson.
- Estimated time.
- Current streak.
- Current concept.
- Continue button.
- Compact progress summary.

It should not show:

- A large marketing hero.
- A long feed.
- Many competing calls to action.

### 16.2 Lesson Screen

The lesson screen should include:

- Brief scenario.
- Task instruction.
- Code editor.
- Run Tests button.
- Reset button.
- Hint button.
- Test output panel.
- Progress state.

The editor should be the main visual focus.

### 16.3 Completion Screen

After success, show:

- Clear completion state.
- Short explanation of why the solution is idiomatic.
- Concepts practiced.
- Next lesson availability.
- Optional review prompt.

The explanation should be concise enough to read in under one minute.

### 16.4 Progress Screen

The progress screen should show:

- Streak.
- Completed lessons.
- Concepts introduced.
- Concepts mastered.
- Review due.
- Concept graph or grouped concept list.

Avoid gamification that pressures long sessions.

### 16.5 Touch and Tablet UX

Tablet requirements:

- Large touch targets.
- Responsive layout for portrait and landscape.
- Editor usable with software keyboard.
- No hover-only controls.
- Buttons reachable without covering code where possible.
- Output panel readable without tiny text.
- Dark mode by default.

Minimum target sizes:

- Primary buttons: 44 px height or larger.
- Icon buttons: 44 x 44 px.
- Editor font: user-adjustable, default 15-17 px.

### 16.6 Desktop UX

Desktop requirements:

- Keyboard shortcuts for run, reset, and hints.
- Wider editor layout.
- Optional split view for instructions and output.
- Same no-autocomplete policy as tablet.

## 17. Visual Design

Design direction:

- Minimal.
- Focused.
- Dark mode first.
- High contrast.
- Calm progress indicators.
- Monospace editor.
- Avoid decorative clutter.

The UI should feel like a compact practice tool, not a marketing site.

Core surfaces:

- Daily lesson.
- Editor.
- Test output.
- Hints.
- Progress.
- Settings.

## 18. Accessibility

Requirements:

- Keyboard navigable on desktop.
- Screen-reader labels for controls.
- Sufficient color contrast.
- Color must not be the only status indicator.
- Font size setting.
- Reduced motion support.
- Clear focus states.
- Error output must be selectable and readable.

## 19. Progression and Scheduling

### 19.1 Daily Lesson Selection

The local scheduler should choose one lesson per local day.

Inputs:

- User's current concept states.
- Prerequisites.
- Recent failures.
- Review due.
- Desired difficulty.
- User's selected learning focus.

Default priority:

1. Review due for weak concepts.
2. Continue current multi-day arc.
3. Introduce next unlocked concept.
4. Reinforce a related earlier concept.

### 19.2 Streak Rules

The streak increments when:

- The user completes the daily lesson for their local date.

The streak should be forgiving:

- Include a limited streak freeze or grace day.
- Avoid punishing travel/timezone edge cases.

The product should record completion by date and timezone offset at completion time.

### 19.3 Extra Practice

Extra practice may exist, but:

- It must be visually secondary.
- It must not be necessary for streaks.
- It should not unlock too much content too quickly.
- It should not undermine the 5-10 minute promise.

## 20. Data Model

### 20.1 User

```json
{
  "id": "local_user",
  "created_at": "2026-07-03T00:00:00Z",
  "timezone": "Europe/Istanbul",
  "settings": {
    "theme": "dark",
    "editor_font_size": 16,
    "daily_reminder_enabled": false
  }
}
```

### 20.2 Lesson Attempt

```json
{
  "id": "attempt_123",
  "user_id": "local_user",
  "lesson_id": "error-enum-parse-user-001",
  "started_at": "2026-07-03T10:00:00Z",
  "completed_at": null,
  "status": "in_progress",
  "validation_attempts": 2,
  "hints_revealed": 1,
  "duration_seconds": 420
}
```

### 20.3 Concept Progress

```json
{
  "user_id": "local_user",
  "concept_id": "enums-error-design",
  "state": "practicing",
  "completed_lessons": 2,
  "successful_reviews": 0,
  "last_practiced_at": "2026-07-03T10:08:00Z",
  "next_review_at": "2026-07-06T00:00:00Z"
}
```

### 20.4 Local Draft

```json
{
  "lesson_id": "error-enum-parse-user-001",
  "files": {
    "src/lib.rs": "..."
  },
  "updated_at": "2026-07-03T10:04:00Z",
  "storage_state": "local_only"
}
```

## 21. Content Authoring Requirements

### 21.1 Authoring Checks

Every lesson must pass:

- Starter project compiles or intentionally fails in the expected way.
- Reference solution passes authoring tests.
- Configured validation metadata or bundle is generated successfully.
- Configured validation fails against incomplete starter code when appropriate.
- Metadata is valid.
- Estimated duration is present.
- Concept ID exists.
- Hints are present and ordered.

### 21.2 Content Review Checklist

Before publishing a lesson, confirm:

- The lesson teaches one concept.
- The task is realistic.
- The code is idiomatic.
- The configured validation checks are fair.
- The public tests are helpful.
- The wording fits on a tablet screen.
- The solution does not require autocomplete.
- The lesson can be completed in under 10 minutes.
- The explanation says why the approach is idiomatic.

### 21.3 Lesson Style Guide

Instructions should:

- Use direct language.
- Avoid long paragraphs.
- Name the exact task.
- Avoid trivia.
- Avoid asking the user to memorize compiler messages.
- Prefer domain examples over abstract placeholders.

Code should:

- Use meaningful names.
- Avoid unnecessary crates.
- Avoid macros unless the lesson teaches a macro-related concept.
- Keep files short.
- Prefer stable Rust.

## 22. Technical Architecture

### 22.1 Repository Layout

Current repository layout:

```text
/
  .github/                 # repository workflows
  AGENTS.md                # workspace guidance
  Makefile                 # backend format/lint/test shortcuts
  mise.toml                # tool versions
  frontend/                # Vite React PWA
  backend/                 # Actix validation service
  docker/                  # runner images
  docs/                    # specs and implementation plans
```

Frontend app layout:

```text
frontend/
  index.html
  package.json
  public/
  scripts/validate-content.mjs
  src/
    components/
    content/
    progress/
    progression/
    pwa/
    storage/
    types/
    validation/
```

Backend app layout:

```text
backend/
  Cargo.toml
  src/
    api.rs
    config.rs
    error.rs
    lib.rs
    main.rs
    model.rs
    queue.rs
    runner.rs
    workspace.rs
```

Docker layout:

```text
docker/
  rust-runner.Dockerfile
```

### 22.2 Current Frontend Architecture

Frontend:

- Static PWA.
- Responsive tablet-first UI.
- Browser code editor with completion disabled.
- Local storage or IndexedDB for drafts and cached lessons.
- Web Worker validation runtime for structural and self-check modes.
- Local scheduler and progress engine.
- Settings, theme, editor font size, reduced motion, export/import, and local deletion controls.

Content:

- Versioned lesson files.
- Static lesson metadata.
- Structural validation metadata.
- Self-check metadata.
- Concept metadata.
- Authoring-only reference solutions are not implemented yet.

Deployment:

- GitHub Pages static deployment is configured for the frontend.
- The frontend must also work when served from a local static server.
- No hosted backend is required for local practice, drafts, progress, or frontend validation.

### 22.3 Current Backend Architecture

Backend:

- Actix HTTP API.
- Thin `POST /run` handler.
- Typed configuration loaded from `RUST_DAILY_*` environment variables through the `config` crate.
- Typed request validation and path/content wrappers.
- Bounded Tokio `mpsc` queue.
- Fixed worker pool.
- Tokio one-shot result channel per job.
- Temporary Cargo workspace assembly.
- Podman runner process launched with `tokio::process::Command`.
- Structured JSON logs through `tracing`.
- Optional CORS origin.

Runner:

- Uses `rust-runner:1.96` by default.
- Runs without network.
- Runs with memory, CPU, PID, read-only filesystem, tmpfs, no-new-privileges, and capability-drop restrictions.
- Runs `cargo test --offline --message-format=json`.

Backend deployment is not implemented yet. The service can be run locally after building the runner image.

### 22.4 Frontend Responsibilities

The frontend handles:

- Rendering daily lesson.
- Editing code.
- Managing local drafts.
- Showing hints.
- Running browser validation.
- Eventually calling backend validation for backend-backed lessons.
- Showing test output.
- Caching app shell and lesson content.
- Tracking local progress.
- Exporting and importing progress data.

### 22.5 Backend Responsibilities

The backend handles:

- Validating submitted file paths and sizes.
- Rejecting unsafe or unsupported submissions before enqueueing.
- Applying bounded queue backpressure.
- Preparing the Cargo workspace.
- Running the restricted Podman command.
- Returning compact run results.
- Reporting structured API errors.

The backend does not currently handle:

- Authentication.
- Accounts.
- Progress persistence.
- Lesson lookup by ID.
- Server-side hidden test selection.
- Database storage.
- Async job polling.
- Multi-language execution.

### 22.6 Local Storage Responsibilities

The app stores locally:

- Settings.
- Drafts.
- Attempts.
- Completion history.
- Concept progress.
- Cached lesson metadata.

Preferred storage:

- IndexedDB for larger data such as drafts and lesson bundles.
- LocalStorage only for small settings or boot flags.

Current implementation uses `localStorage` for drafts, progress, and settings.

### 22.7 Static Asset Layout

Suggested asset layout:

```text
/index.html
/manifest.webmanifest
/service-worker.js
/assets/app.js
/assets/app.css
/assets/validation-engine.wasm
/content/concepts.json
/content/lessons/index.json
/content/lessons/error-enum-parse-user-001/lesson.json
/content/lessons/error-enum-parse-user-001/files.json
/content/lessons/error-enum-parse-user-001/validation.json
```

Current frontend implementation bundles lesson and concept JSON through Vite instead of serving a separate `/content/` tree. Moving to external content bundles remains a future portability improvement.

### 22.8 Frontend Validation Job

```json
{
  "lesson_id": "error-enum-parse-user-001",
  "mode": "browser-rust",
  "files": {
    "src/lib.rs": "..."
  }
}
```

### 22.9 Frontend Validation Response

```json
{
  "status": "passed",
  "duration_ms": 914,
  "summary": "All tests passed",
  "diagnostics": "",
  "completed": true
}
```

### 22.10 Backend Validation Job

```json
{
  "files": [
    {
      "path": "src/lib.rs",
      "content": "..."
    },
    {
      "path": "tests/lesson.rs",
      "content": "..."
    }
  ]
}
```

### 22.11 Backend Validation Response

```json
{
  "status": "passed",
  "stdout": "...",
  "stderr": "",
  "duration_ms": 914
}
```

### 22.12 Progress Portability

Because there is no account system in MVP, progress portability should use files:

- Export progress as JSON.
- Import progress from JSON.
- Never require cloud sync to keep a streak.

Current implementation supports progress export/import from the settings screen.

## 23. Privacy

Privacy requirements:

- Store only the minimum local data needed for progress.
- Do not use submitted code to train AI models.
- Do not send code to AI services.
- Do not send code to any remote validation service unless the user/deployment has explicitly enabled backend validation.
- Make backend-backed lessons visibly different from fully local browser-validated lessons.
- Make this explicit in product copy.
- Allow progress export.
- Allow local data deletion.

## 24. Analytics

MVP analytics are local-only product counters used to tune the experience for the user.

Allowed local analytics:

- Lesson started.
- Lesson completed.
- Validation status.
- Time to complete.
- Hint level revealed.
- Concept practiced.
- Device class.

Do not collect:

- Keystroke-level telemetry.
- Full source code by default.
- Clipboard contents.
- External browsing data.
- Remote telemetry by default.

Analytics should help improve lesson quality, not optimize addiction loops.

## 25. Notifications

Daily reminders are optional.

Requirements:

- Disabled by default unless the user opts in.
- Configurable time.
- Respect quiet hours.
- Easy to disable.

Notification copy should be low-pressure.

## 26. Settings

Settings should include:

- Theme.
- Editor font size.
- Reminder preference.
- Reminder time.
- Reduced motion.
- Data export.
- Data import.
- Local data reset.
- Reset local drafts.

Optional later settings:

- Preferred difficulty.
- Learning focus.
- Keyboard bindings.

## 27. Success Metrics

Product quality metrics:

- Median lesson completion time: 5-10 minutes.
- High percentage of lessons completed on first or second day attempted.
- Low abandonment during editor session.
- Streak continuation without excessive daily session length.
- Validation failures reveal fair gaps, not confusing traps.

Learning metrics:

- Concept mastery growth.
- Review success rate.
- Reduced repeated errors in the same concept.
- Completion of multi-day arcs.

Technical metrics:

- Validation latency.
- Validation timeout rate.
- PWA cache reliability.
- Draft recovery rate.
- Crash-free sessions.

## 28. MVP Scope

### 28.1 MVP Must Include

- PWA shell.
- Static frontend deployment.
- Dark tablet-first UI.
- Daily lesson screen.
- Code editor with syntax highlighting and no autocomplete.
- Browser-side Check or Run Tests flow.
- Browser validation for supported lessons.
- Authored hints.
- Completion explanation.
- Local draft saving.
- Basic streak.
- Basic concept progress.
- Progress export/import.
- Initial curriculum of 30 lessons.

### 28.2 MVP Curriculum

The first 30 lessons should cover:

- Structs.
- Enums.
- Methods.
- Basic ownership choices.
- `Option`.
- `Result`.
- Pattern matching.
- `Display`.
- `Error`.
- `From`.
- `TryFrom`.
- Basic tests.
- Simple iterators.

### 28.3 MVP Exclusions

Exclude from MVP:

- AI features.
- User accounts.
- Cloud sync.
- Secret hidden tests.
- Social features.
- Leaderboards.
- Mobile native apps.
- Large projects.
- Marketplace/community lessons.
- Advanced analytics dashboards.

Backend validation may exist before the frontend uses it, but a hosted backend is not required for the local-first MVP. Server-side `cargo test` is optional until frontend integration and backend-backed lesson content are explicitly introduced.

### 28.4 Current MVP Implementation Status

Implemented:

- Frontend PWA shell.
- Static GitHub Pages deployment workflow for the frontend.
- Dark-first UI with light/system theme control.
- Daily lesson screen.
- CodeMirror Rust editor with no autocomplete extension.
- Browser-side structural/self-check validation flow.
- Authored hints and completion explanations.
- Local draft saving.
- Basic streak and concept progress.
- Progress export/import.
- Local progress deletion and draft deletion.
- 30-lesson initial curriculum.
- Optional Actix backend service for Cargo-backed validation.
- Podman runner image definition.

Partially implemented:

- Validation: `structural` and `self-check` are implemented; `browser-rust` is not implemented; backend validation exists but is not called by the frontend.
- Scheduling: current selector continues the first incomplete lesson, then cycles by local date after all lessons are complete; it does not yet enforce one lesson per local day or review due logic.
- Progress: summary exists; full progress/concept graph screen is not implemented.
- Settings: theme, editor font size, reduced motion, export/import, progress reset, and draft reset exist; reminder settings do not exist.

Not yet implemented:

- Frontend `POST /run` integration.
- Backend-backed lesson content/test bundling.
- Browser Rust compiler/test runner.
- Hosted backend deployment workflow.
- Full spaced repetition scheduler.
- Full progress screen.
- Notifications.
- Authoring pipeline with starter/solution compile checks.
- Reference solutions.
- Automated frontend test runner.
- End-to-end browser tests.

## 29. Post-MVP Roadmap

Possible later additions:

- Frontend integration with backend `POST /run`.
- Backend deployment and operational documentation.
- Backend-backed lesson content schema.
- Spaced repetition review queue.
- Full concept graph visualization.
- More advanced lifetime lessons.
- Iterator design arcs.
- Module organization arcs.
- Async Rust lessons.
- Crate-specific tracks.
- Better browser validation coverage.
- Browser Rust validation engine.
- Optional local/native validation export workflow.
- Authoring tools for lesson creators.
- Team mode for companies.
- Server-side hidden tests only if a future scored/account-backed mode needs tamper-resistant validation.

## 30. Acceptance Criteria

The app is successful at MVP when:

- A user can open the PWA on an Android tablet.
- The user can complete one daily Rust lesson in under 10 minutes.
- The editor provides syntax highlighting but no autocomplete or AI help.
- The user can run supported checks and receive validation feedback.
- Drafts survive refresh and offline periods.
- Progress and streak update locally after completion.
- The app clearly explains the idiomatic Rust idea after completion.
- The initial 30 lessons follow the one-concept rule.
- The frontend can be deployed as static files without a custom backend.
- Optional backend validation can be run locally for Cargo-backed experiments without changing the local-first progress model.

## 31. Open Product Questions

Questions to resolve before implementation:

- Which browser Rust validation engine should be used initially?
- Which lesson concepts are safe for the first browser validation subset?
- Which lessons should be converted first to backend `cargo test` validation?
- Should backend-backed validation be local-only, hosted, or configurable per deployment?
- How should backend-backed lessons explain that code is sent to the configured runner?
- Should `rustfmt` be available as a manual button in MVP?
- How strict should streak recovery be?
- Should users be allowed to do tomorrow's lesson early?
- Should solution reveal exist after repeated failures, or should users only receive hints?
- Should lessons be authored in a separate repository or inside the app repository?

## 32. First Implementation Milestones

Milestone 1: Static prototype.

- Render daily lesson from local JSON/YAML.
- Show editor.
- Save local draft.
- Disable autocomplete.
- Show static hints.

Milestone 2: Validation prototype.

- Load validation engine in a Web Worker.
- Run one browser-supported validation bundle.
- Return structured validation output.
- Show diagnostics and test output in UI.

Milestone 3: Progress prototype.

- Create attempts.
- Mark lesson complete.
- Track streak.
- Track concept progress.
- Reset local progress for pre-release QA.

Milestone 4: PWA readiness.

- Cache app shell.
- Cache current lesson.
- Preserve drafts offline.
- Add install metadata.

Milestone 5: MVP content.

- Author 30 lessons.
- Run lesson validation checks.
- Review all hints and explanations.
- Test each lesson on tablet viewport.

MVP portability hardening:

- Export and import progress JSON.

Backend validation milestone:

- Connect frontend validation client to optional `POST /run`.
- Extend lesson content with public test files for backend-backed lessons.
- Normalize backend `timed_out` and frontend `timeout` status naming.
- Add unavailable/offline state for backend-backed lessons.
- Add backend deployment workflow or documented local-only mode.
