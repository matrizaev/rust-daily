# Frontend Backend Integration Plan

## Goal

Connect the React PWA to the Actix `POST /run` backend so selected lessons can be validated with real `cargo test --offline` in the Podman runner.

The integration should preserve the local-first product model:

- Existing `structural` and `self-check` lessons keep working without a backend.
- Backend validation is used only by lessons that explicitly opt into it.
- No code is sent to a remote service unless the lesson requires backend validation.
- The first integration should prove one backend-backed lesson end to end before converting more content.

## Current Baseline

Implemented now:

- Frontend app in `frontend/`.
- Backend service in `backend/`.
- Runner image in `docker/rust-runner.Dockerfile`.
- Frontend validation worker supports:
  - `structural`.
  - `self-check`.
  - `browser-rust` as unsupported placeholder.
- Backend exposes:
  - `POST /run`.
  - Request files: `src/lib.rs`, `tests/lesson.rs`.
  - Response statuses: `passed`, `failed`, `compile_error`, `timed_out`, `internal_error`.
- Backend validates paths, sizes, queue capacity, and runs Podman with sandbox restrictions.

Missing now:

- Frontend has no build/runtime backend URL config.
- Frontend `LessonValidation` has no backend validation mode.
- Lesson content has no `tests/lesson.rs` payload.
- Validation UI has no `compile_error` status.
- Lesson footer currently says checks run locally in the browser, which would be false for backend-backed lessons.
- GitHub Pages deployment has no hosted backend pairing.

## Scope

Include:

- Add a frontend `backend-cargo-test` validation mode.
- Add backend URL configuration through build/dev environment.
- Add a backend validation client around `fetch`.
- Normalize backend results into the existing `ValidationResult` shape.
- Add privacy/UI copy when a lesson sends code to the configured backend.
- Convert one lesson to backend validation as a smoke slice.
- Keep all existing browser-backed lessons working.
- Update content validation.
- Update docs for local integrated development.

Exclude:

- Server-side hidden tests.
- Accounts.
- Cloud sync.
- Backend progress persistence.
- Async job polling.
- Multi-file editable lessons.
- Converting all 30 lessons.
- Browser Rust compiler integration.
- Hosted backend deployment.

## Target User Flow

With the configured backend unavailable:

1. User opens the PWA.
2. Browser-backed lessons work as they do today.
3. Backend-backed lessons attempt the configured runner and show an unavailable state if it cannot be reached.
4. Drafts still save locally.

With the configured backend reachable:

1. User opens a backend-backed lesson.
2. The lesson clearly says checks run on the configured Rust runner.
3. User taps Check.
4. Frontend sends `src/lib.rs` plus lesson-authored `tests/lesson.rs` to `POST /run`.
5. Backend returns a run result.
6. UI shows pass, test failure, compile error, timeout, runner unavailable, or internal error.
7. Progress is recorded only when the normalized result is `passed`.

## Data Contract

### Lesson Validation Type

Extend `frontend/src/types/validation.ts`:

```ts
export type BackendCargoTestValidation = {
  mode: "backend-cargo-test";
  timeoutMs: number;
  testCode: string;
};
```

Add this variant to `LessonValidation`.

Rules:

- `testCode` becomes `tests/lesson.rs` in the backend request.
- User-edited code remains `src/lib.rs`.
- Tests are public and shipped with the frontend bundle.
- Tests are not secret and must not be described as hidden.

### Backend Request

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

### Backend Response

```json
{
  "status": "compile_error",
  "stdout": "...",
  "stderr": "...",
  "duration_ms": 914
}
```

### Frontend Status Mapping

Backend to frontend:

- `passed` -> `passed`.
- `failed` -> `failed`.
- `compile_error` -> `compile_error`.
- `timed_out` -> `timeout`.
- `internal_error` -> `internal_error`.
- HTTP `413` -> `failed` with a size-limit message.
- HTTP `429` -> `unsupported` with a runner-busy message.
- Network error / CORS error -> `unsupported`.
- Invalid backend response -> `internal_error`.

Extend `ValidationStatus` with:

```ts
| "compile_error"
```

Do not add a separate `timed_out` frontend status in the first integration. Normalize it to the existing `timeout`.

## Frontend Implementation

### 1. Backend URL Configuration

Add frontend configuration for the Rust runner URL.

Rules:

- Backend validation is always available for lessons with `backend-cargo-test`.
- Local development defaults to `http://127.0.0.1:8080`.
- Production builds default to `https://borrowquest.site`.
- `VITE_RUST_DAILY_BACKEND_URL` can override the default at build or dev-server start.
- `window.__RUST_DAILY_BACKEND_URL__` can override the default at runtime when injected before the app bundle loads.
- Schemeless host values are accepted; localhost-style hosts default to `http`, other hosts default to `https`.
- Trim trailing slashes before appending `/run`.

### 2. Settings UI

Do not add backend validation settings. Settings should only mention that browser-backed checks stay local and backend-backed checks send current code to the configured Rust runner.

### 3. Validation Types

Update `frontend/src/types/validation.ts`.

Add:

- `BackendCargoTestValidation`.
- `compile_error` frontend status.
- Backend request/response DTO types, or keep those near the backend client if they are not shared elsewhere.

### 4. Backend Validation Client

Create `frontend/src/validation/backendValidation.ts`.

Responsibilities:

- Build `POST /run` request.
- Use `AbortController` with `timeoutMs`.
- Map backend `RunResult` to frontend `ValidationResult`.
- Map backend HTTP errors to user-readable summaries.
- Avoid throwing from the public function; return a `ValidationResult`.
- Keep raw stdout/stderr in `diagnostics`.
- Cap diagnostics on the frontend side as a second guard, even though the backend already caps output.

Recommended public function:

```ts
export const runBackendValidation = async (
  request: ValidationRequest,
  backendUrl: string,
): Promise<ValidationResult>;
```

### 5. Validation Dispatcher

Update `frontend/src/validation/validationClient.ts`.

Current behavior:

- Always creates a Web Worker.

New behavior:

- If mode is `structural`, `self-check`, or placeholder `browser-rust`, use the existing worker path.
- If mode is `backend-cargo-test`, use `runBackendValidation`.

Recommended signature:

```ts
export const runValidation = (request: ValidationRequest) => Promise<ValidationResult>;
```

### 6. Lesson Screen Wiring

Update `frontend/src/components/LessonScreen.tsx`.

Changes:

- Use the configured backend URL for backend-backed lessons.
- Include `testCode` in the request through the validation object, not through the editable files map.
- Keep stale-result behavior unchanged.
- Continue completing lessons only on `passed` or `self_check`.

Update footer copy:

- Browser modes: `Checks run locally in your browser.`
- Backend mode: `Checks run on the configured Rust runner.`

### 7. Validation Panel

Update `frontend/src/components/ValidationPanel.tsx`.

Add:

- `compile_error` label: `Compile error`.
- `compile_error` icon/tone. It can share the failed/error tone.
- Copy for backend unavailable should be supplied by the result summary, not hard-coded in the panel.

### 8. Content Schema

Update `frontend/src/types/lesson.ts` indirectly through `LessonValidation`.

Update `frontend/scripts/validate-content.mjs`.

Changes:

- Add `backend-cargo-test` to allowed validation modes.
- Require non-empty `testCode` for `backend-cargo-test`.
- Require `timeoutMs` for `backend-cargo-test`.
- Permit backend lessons to mention checking, compiling, or tests in copy if the copy is honest.
- Keep forbidding unsupported compiler/test promises for `structural` and `self-check`.

### 9. First Backend-Backed Lesson

Convert one lesson only.

Recommended first lesson:

- `error-enum-parse-user-001`.

Reason:

- The starter code currently fails to compile until the missing enum variants are added.
- A backend test can check both compile success and parser behavior.
- It is early in the curriculum and easy to manually verify.

Suggested public test:

```rust
use rust_daily_lesson::{parse_user, ParseUserError, User};

#[test]
fn parses_valid_user() {
    assert_eq!(
        parse_user("42,Ada,ada@example.com"),
        Ok(User {
            id: 42,
            name: "Ada".to_owned(),
            email: "ada@example.com".to_owned(),
        })
    );
}

#[test]
fn returns_named_parse_errors() {
    assert_eq!(parse_user(""), Err(ParseUserError::MissingName));
    assert_eq!(parse_user("42,Ada"), Err(ParseUserError::MissingEmail));
    assert_eq!(parse_user("nope,Ada,ada@example.com"), Err(ParseUserError::InvalidId));
}
```

Before implementation, verify the exact parser behavior for empty input. If the first assertion above does not match the existing parser, adjust the test to match the lesson contract rather than changing unrelated curriculum behavior.

Keep the existing structural check lessons unchanged until the first backend path is stable.

## Backend Implementation

The first integration should require little backend code. The backend already has the required `POST /run` contract.

Backend changes to consider:

- Confirm CORS works for Vite dev server:
  - `RUST_DAILY_CORS_ORIGIN=http://localhost:5173`.
- Confirm CORS works for GitHub Pages if a hosted backend is later used.
- Consider adding a lightweight `GET /health` endpoint in a later milestone if the settings UI needs connection testing.

Do not add hidden tests or lesson ID lookup in this milestone.

## Development Workflow

### Local Backend

Build runner image:

```bash
podman build -f docker/rust-runner.Dockerfile -t rust-runner:1.96 .
```

Start backend:

```bash
RUST_DAILY_CORS_ORIGIN=http://localhost:5173 cargo run --manifest-path backend/Cargo.toml
```

### Local Frontend

Start frontend:

```bash
cd frontend
npm run dev
```

Optional frontend URL override:

```bash
cd frontend
VITE_RUST_DAILY_BACKEND_URL=http://127.0.0.1:8080 npm run dev
```

## Verification Plan

### Backend

Run:

```bash
make format
make lint
make test
```

Manual runner check:

```bash
podman build -f docker/rust-runner.Dockerfile -t rust-runner:1.96 .
RUST_DAILY_CORS_ORIGIN=http://localhost:5173 cargo run --manifest-path backend/Cargo.toml
```

Then send a known valid `POST /run` payload and confirm:

- `passed` for correct code.
- `compile_error` for syntax/type errors.
- `failed` for test failures.
- `timed_out` for timeout behavior if practical.
- `429` when queue capacity is forced low and saturated, if practical.

### Frontend

Run from `frontend/`:

```bash
npm run content:check
npm run build
VITE_BASE_PATH=/rust-daily/ npm run build
yes | npx fallow dupes
yes | npx fallow dead-code
yes | npx fallow health
```

Manual app checks:

- Existing structural lesson still validates without backend.
- Existing self-check lesson still records completion without backend.
- Backend-backed lesson sends code only after Check is pressed.
- Correct solution passes.
- Starter or broken code produces compile/test feedback.
- Backend result becomes stale after editing.
- Completion records progress only after `passed`.
- Offline/unreachable backend preserves drafts and shows a clear unavailable state.

## Acceptance Criteria

- Frontend has build/dev-time backend URL configuration.
- Backend validation is always available for `backend-cargo-test` lessons.
- `backend-cargo-test` lesson mode exists in TypeScript and content validation.
- One lesson uses `backend-cargo-test`.
- Existing non-backend lessons continue to work.
- Backend-backed lesson calls `POST /run` only when Check is pressed.
- Backend responses map cleanly into the existing validation panel.
- Compile errors are visibly distinct from normal test failures.
- UI copy no longer claims all checks are local when backend validation is used.
- Drafts and progress remain local browser data.
- No hidden tests are introduced.
- No account or cloud sync assumptions are introduced.

## Risks

Risk: GitHub Pages frontend cannot reach a local backend because browsers block mixed origins or CORS.

Mitigation:

- Configure the backend URL at build or dev-server start.
- Document `RUST_DAILY_CORS_ORIGIN`.
- Show a clear unavailable result for CORS/network failures.

Risk: Tests shipped in frontend are editable by advanced users.

Mitigation:

- Treat backend validation as practice feedback, not tamper-resistant grading.
- Do not add scores, credentials, or competitive features on top of client-supplied tests.

Risk: Backend status naming differs from frontend status naming.

Mitigation:

- Normalize `timed_out` to `timeout` at the frontend boundary.
- Add `compile_error` to frontend statuses.

Risk: Content JSON becomes too large if many tests are embedded.

Mitigation:

- Convert one lesson first.
- Move toward external lesson bundles only after the shape is proven.

## Follow-Up Milestones

After the first end-to-end slice:

1. Convert a small subset of lessons where behavior tests are clearly better than structural checks.
2. Add a backend health endpoint and settings connection test.
3. Add browser or component tests around validation dispatch and result mapping.
4. Add external content bundles if embedded tests make the main app bundle too large.
5. Decide whether backend validation should remain local-only, be self-hosted by users, or be hosted for a public deployment.
