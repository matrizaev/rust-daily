# Rust Daily Backend Specification

## 1. Purpose

The Rust Daily backend is an optional future validation service for running Rust
lesson submissions with normal Cargo tooling in an isolated container.

The current product MVP remains frontend-only. This backend spec describes the
smallest viable server-side runner to introduce only when a later milestone
explicitly adds remote execution.

Primary backend responsibility:

- Accept submitted lesson files.
- Queue each run request with bounded capacity.
- Execute the submission in a sandboxed Rust runner container.
- Run the authored tests supplied with the request using `cargo test --offline`.
- Return a compact JSON result to the frontend.

The backend must not become a general cloud IDE, account system, async job
platform, or multi-language judge in its MVP form.

## 2. Architecture Summary

```text
PWA
  ↓ POST /run
Actix backend API
  ↓ bounded tokio mpsc queue
Fixed worker pool
  ↓ podman run --rm ...
Sandbox container
  ↓ cargo test --offline
Run result JSON
```

The HTTP handler is intentionally thin. It validates the request, creates a
one-shot response channel, tries to enqueue the job, waits for the worker
result, and returns JSON. All filesystem, test assembly, Podman, timeout, and
output-capping behavior belongs in a runner module.

## 3. Technology Stack

Use Rust for the backend.

Required crates:

- `actix-web` for HTTP routing and JSON handling.
- `tokio` for async runtime, process execution, channels, and timeouts.
- `serde` for request and response serialization.
- `tempfile` for per-job temporary workspaces.
- `uuid` for job/workspace identifiers.
- `thiserror` for typed internal error definitions and error-to-response mapping.

Optional crates:

- `tower_http` for CORS, if the backend is served from a different origin than
  the PWA.
- `tracing` and `tracing-subscriber` for structured logs.

Required external runtime:

- Podman available on the backend host.
- A prebuilt runner image named `rust-runner:1.96` or configured equivalent.

## 4. API Surface

### 4.1 `POST /run`

Submits one Rust validation job and waits synchronously for the result.

This is the only MVP endpoint.

#### Request Body

```json
{
  "files": [
    {
      "path": "src/lib.rs",
      "content": "pub fn answer() -> u64 { 42 }\n"
    },
    {
      "path": "tests/lesson.rs",
      "content": "#[test]\nfn answer_is_42() {\n    assert_eq!(rust_daily_lesson::answer(), 42);\n}\n"
    }
  ]
}
```

The request contains every file needed for the run, including the user's source
code and the lesson-authored tests. The backend MVP does not use the lesson ID
to find server-side hidden tests.

#### Response Body

```json
{
  "status": "passed",
  "stdout": "running 1 test\n...",
  "stderr": "",
  "duration_ms": 842
}
```

#### Status Codes

- `200 OK`: The job ran and a `RunResult` is returned. Test failures still use
  `200 OK`; the failure is represented by `status`.
- `400 Bad Request`: The request is malformed or fails validation.
- `413 Payload Too Large`: The request exceeds configured size limits.
- `429 Too Many Requests`: The bounded queue is full.
- `500 Internal Server Error`: The backend failed before it could produce a
  normal run result.

## 5. Data Model

### 5.1 Request Types

```rust
struct RunRequest {
    files: Vec<SubmittedFile>,
}

struct SubmittedFile {
    path: String,
    content: String,
}
```

### 5.2 Response Types

```rust
struct RunResult {
    status: RunStatus,
    stdout: String,
    stderr: String,
    duration_ms: u64,
}

enum RunStatus {
    Passed,
    Failed,
    CompileError,
    TimedOut,
    InternalError,
}
```

Serialized `RunStatus` values should use stable snake-case strings:

```text
passed
failed
compile_error
timed_out
internal_error
```

### 5.3 Internal Job Type

```rust
struct RunJob {
    id: Uuid,
    request: RunRequest,
    response_tx: oneshot::Sender<RunResult>,
}
```

The job ID is for logs, temporary workspace naming, and future diagnostics. It
does not need to be exposed in the MVP response.

## 6. Queue and Worker Model

Use a bounded queue and a fixed worker pool.

MVP defaults:

```text
queue capacity: 20
workers: 2
job timeout: 10 seconds
max combined output returned: 64 KB
```

Implementation requirements:

- Use `tokio::sync::mpsc` for the bounded queue.
- Use `tokio::sync::oneshot` for returning each job result to the HTTP handler.
- Enqueue with a non-blocking send/try-send path so a full queue can return
  `429 Too Many Requests` immediately.
- Spawn a fixed number of worker tasks at process startup.
- Each worker loops until the queue is closed.
- A worker must always attempt to send a `RunResult`, even for compile errors,
  test failures, timeouts, and runner errors.

## 7. Runner Flow

For each accepted job:

1. Create a unique temporary workspace.
2. Validate and write submitted files into that workspace.
3. Add any required Cargo template files that were not supplied by the request.
4. Run the configured Podman command.
5. Capture stdout, stderr, exit status, and elapsed duration.
6. Cap returned output to the configured maximum.
7. Delete the temporary workspace.
8. Send a `RunResult` through the job's one-shot response channel.

Temporary workspaces must be cleaned up after every run. Cleanup should happen
even when Podman fails, times out, or returns non-zero.

## 8. Workspace Assembly

The backend must run submissions inside a predictable Cargo project layout.

Recommended MVP workspace:

```text
workspace/
  Cargo.toml
  src/
    lib.rs
  tests/
    lesson.rs
```

Rules:

- Prefer a prebuilt lesson/template crate over accepting an arbitrary Cargo
  project from the browser.
- Copy submitted source and test files into known paths in the template.
- Store lesson-authored tests in the same frontend lesson content/source of
  truth as the editable starter code.
- Send those tests to the backend in the same `RunRequest` as the user's code.
- Do not map lesson IDs to server-side hidden tests in the MVP.
- Run Cargo in offline mode, so all dependencies must already be available in
  the runner image.

The MVP can start with standard-library-only lessons. Third-party crates require
the runner image to pre-cache those dependencies.

Because tests are supplied by the client, backend validation is a practice
feedback mechanism rather than tamper-resistant grading. This is acceptable for
the no-account MVP, but future scored or credentialed features would need
server-side test selection, signed bundles, or another trust boundary.

## 9. Request Validation

The handler or a dedicated validation module must reject unsafe or oversized
requests before enqueueing.

Minimum validation:

- `files` must be non-empty.
- File paths must be relative.
- File paths must not contain `..`.
- File paths must not be absolute.
- File paths must not target generated or host-sensitive locations.
- File contents must be valid UTF-8 JSON strings.
- Total request size must be capped.
- Number of submitted files must be capped.
- Individual file size must be capped.

Recommended MVP limits:

```text
max files per request: 8
max single file size: 64 KB
max total submitted content: 256 KB
```

The MVP should only allow an explicit path allowlist. User-editable lesson code
must be limited to `src/lib.rs`; lesson-authored tests are supplied separately
as `tests/lesson.rs`.

```text
src/lib.rs
tests/lesson.rs
```

Do not allow multiple editable source files in the first backend-backed lessons.
If a future lesson needs additional editable paths, add them deliberately in a
later spec update.

## 10. Podman Execution

The runner must use `tokio::process::Command` to execute Podman.

Conceptual command:

```bash
podman run --rm \
  --network none \
  --memory 256m \
  --cpus 0.5 \
  --pids-limit 128 \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=64m \
  --security-opt no-new-privileges \
  --cap-drop all \
  -v /tmp/job-123:/workspace:Z \
  -w /workspace \
  rust-runner:1.96 \
  timeout 10s cargo test --offline
```

Implementation notes:

- Build command arguments as separate `Command::arg` values.
- Do not invoke a shell to build the Podman command.
- Use the configured workspace path for the bind mount.
- Apply both an outer Tokio timeout and the inner `timeout 10s` process guard.
- Treat timeout as `RunStatus::TimedOut`.
- Treat Rust compilation failures as `RunStatus::CompileError`.
- Treat non-zero test exits after successful compilation as `RunStatus::Failed`.

## 11. Sandbox Restrictions

Every run must use the following restrictions:

```text
--network none
--memory 256m
--cpus 0.5
--pids-limit 128
--read-only
--tmpfs /tmp:rw,noexec,nosuid,size=64m
--security-opt no-new-privileges
--cap-drop all
timeout 10s
```

Security requirements:

- The container must not have network access.
- The mounted workspace must be the only user-controlled filesystem input.
- The runner image must not contain secrets.
- The backend process must not pass host secrets into the container.
- The run must be short-lived and removed with `--rm`.
- The backend must cap stdout and stderr to avoid memory exhaustion.

## 12. Runner Image

The simplest image can start from Rust slim:

```dockerfile
FROM rust:1.96-slim
WORKDIR /workspace
RUN rustup component add clippy rustfmt
```

For real use, the image should pre-cache a template crate and any lesson
dependencies:

```text
Cargo.toml
src/lib.rs
tests/lesson.rs
```

Image requirements:

- `cargo test --offline` must work without network access.
- The default toolchain version must be pinned to Rust 1.96.
- The template crate must use Rust 2024 edition with `edition = "2024"` in
  `Cargo.toml`.
- Dependencies must be pinned and cached at build time.
- The image should be rebuilt deliberately when lesson dependencies change.

## 13. Configuration

Backend behavior should be configurable through environment variables with sane
defaults.

Recommended configuration:

```text
RUST_DAILY_HOST=127.0.0.1
RUST_DAILY_PORT=8080
RUST_DAILY_QUEUE_CAPACITY=20
RUST_DAILY_WORKERS=2
RUST_DAILY_TIMEOUT_SECS=10
RUST_DAILY_MAX_OUTPUT_BYTES=65536
RUST_DAILY_RUNNER_IMAGE=rust-runner:1.96
RUST_DAILY_WORKSPACE_ROOT=/tmp/rust-daily-runs
RUST_DAILY_CORS_ORIGIN=
```

If `RUST_DAILY_CORS_ORIGIN` is empty, the backend may omit CORS middleware.

## 14. Error Handling and Result Classification

The backend should prefer returning a structured `RunResult` over surfacing
implementation details as HTTP errors.

Use HTTP errors for:

- Invalid request shape or size.
- Full queue.
- Service-level failure before a job is accepted.

Use `RunResult.status` for:

- Passing tests.
- Failing tests.
- Compilation errors, which must be classified as `compile_error` rather than
  collapsed into ordinary test failures.
- Timeouts.
- Runner/container failures after the job starts.

Output handling:

- Return stdout and stderr separately.
- Cap output to `RUST_DAILY_MAX_OUTPUT_BYTES`.
- If output is truncated, include a short truncation marker.
- Do not separately echo submitted source or test files in API responses. Cargo
  and compiler output may still include file names, line numbers, and excerpts.

## 15. Observability

Minimum logging:

- Job accepted.
- Job rejected due to queue capacity.
- Job started by worker.
- Job finished with status and duration.
- Podman spawn failure.
- Timeout.
- Workspace cleanup failure.

Logs should include the internal job ID. Logs must not include full submitted
source code by default.

Useful future metrics:

- Queue depth.
- Run duration histogram.
- Result status counts.
- Timeout count.
- Podman spawn failure count.

## 16. Frontend Integration

The frontend should treat the backend runner as an optional validation mode.

Integration expectations:

- The PWA sends the user's current source files and the lesson-authored test
  files to `POST /run`.
- The PWA renders `stdout`, `stderr`, `status`, and elapsed time.
- The PWA represents `compile_error` distinctly from failing tests and shows the
  compiler diagnostics clearly enough for the learner to fix their code.
- A `passed` result can unlock completion for backend-backed lessons.
- A `failed`, `compile_error`, or `timed_out` result should not complete the
  lesson.
- Network or `429` failures should be shown as service availability issues, not
  as incorrect user answers.
- Since tests are sent by the client, completion is not tamper-resistant and
  should be treated like local progress in the frontend-only MVP.

This backend does not replace frontend structural checks for lessons that still
use browser-only validation.

## 17. Non-Goals for Backend MVP

Do not include the following in the backend MVP:

- Kubernetes orchestration.
- Firecracker or microVM isolation.
- Async job polling.
- Persistent job history.
- User accounts.
- Authentication.
- Billing or quotas per account.
- Multi-language support.
- AI grading.
- AI code review.
- Cloud sync.
- Full browser IDE features.
- Arbitrary Cargo projects from users.
- Tamper-resistant grading with secret server-side tests.

These can be reconsidered only after the small `POST /run` service is working,
secure, and useful.

## 18. Suggested Backend Module Layout

Future backend code should live under `backend/`.

Suggested layout:

```text
backend/
  Cargo.toml
  src/
    main.rs
    config.rs
    api.rs
    model.rs
    queue.rs
    runner.rs
    workspace.rs
    error.rs
```

Responsibilities:

- `main.rs`: load config, create queue, spawn workers, start Actix server.
- `config.rs`: environment configuration and defaults.
- `api.rs`: `/run` handler and HTTP error mapping.
- `model.rs`: request, response, and job types.
- `queue.rs`: bounded queue setup and worker spawning.
- `runner.rs`: Podman command execution and result classification.
- `workspace.rs`: temporary directory creation, path validation, file writing,
  submitted test/template assembly, cleanup helpers.
- `error.rs`: backend error types.

## 19. Acceptance Criteria

The backend MVP is complete when:

- `POST /run` accepts a valid request and returns a JSON `RunResult`.
- `POST /run` executes authored tests supplied in the request alongside the
  user's code.
- Backend-backed lessons accept user edits only for `src/lib.rs` in the MVP.
- A passing Rust submission returns `status: "passed"`.
- A failing test returns `status: "failed"` with useful output.
- A compile error returns `status: "compile_error"` with compiler diagnostics
  preserved in the result output.
- The frontend UI displays compile errors as compiler diagnostics, not as
  ordinary failed tests.
- A long-running submission is terminated and returns `status: "timed_out"`.
- The queue is bounded and full queues return `429 Too Many Requests`.
- Exactly two workers run by default.
- The default queue capacity is 20.
- The default timeout is 10 seconds.
- Returned output is capped at 64 KB.
- Each job runs in a temporary workspace that is cleaned up afterward.
- Podman runs with no network, memory/CPU/PID limits, read-only root filesystem,
  a tmpfs `/tmp`, `no-new-privileges`, and all capabilities dropped.
- `cargo test --offline` succeeds in the runner image without network access.
- The runner image uses Rust 1.96 and the template crate uses Rust 2024 edition.
- The backend does not map lesson IDs to hidden tests or load hidden tests from
  disk/image in the MVP.
- Podman logic is isolated outside the Actix handler.

## 20. Open Questions

No open questions remain for the backend MVP spec.
