# Rust Daily Architecture

## Overview

Rust Daily is a local-first Progressive Web App with a server-side Rust runner.
The browser owns lesson navigation, editing, drafts, and progress. The backend
has one narrow responsibility: compile and test submitted lesson code in an
isolated container.

```mermaid
flowchart LR
    Author[Lesson author] --> Source[lessons/]
    Source --> Generator[Content validation and generation]
    Generator --> Content[Frontend lesson JSON]

    Browser[React PWA] --> Content
    Browser <--> Storage[Browser localStorage]
    Browser --> Worker[Browser validation worker]
    Browser -->|POST /run| API[Actix API]
    API --> Queue[Bounded Tokio queue]
    Queue --> Runner[Runner workers]
    Runner --> Workspace[Temporary Cargo workspace]
    Workspace --> Podman[Restricted Podman container]
    Podman --> Cargo[cargo test --offline]
```

The design follows four principles:

1. **Local-first learning:** the app shell, lesson content, drafts, settings, and
   progress do not require an account or server-side persistence.
2. **Authored validation:** checks and solutions come from the curriculum, not
   from AI-generated grading.
3. **Explicit trust boundaries:** submitted Rust runs outside the web process
   with resource and network restrictions.
4. **Source/runtime separation:** author notes and solutions stay in the
   authoring tree and are not shipped as normal lesson content.

The current content set contains 90 schema-V2 lessons in 15 arcs. Every lesson
combines a structural browser check with Cargo-backed validation.

## Repository Boundaries

| Path | Responsibility |
| --- | --- |
| `frontend/` | React UI, lesson loading, browser checks, PWA behavior, and local persistence |
| `backend/` | Actix API, request validation, queueing, workspace creation, and runner orchestration |
| `docker/` | Rust runner image, dependency cache, and advanced test entrypoint |
| `lessons/` | Canonical lesson metadata, starter files, public tests, notes, and reference solutions |
| `config/` | Shared, local, and production backend configuration |
| `docs/` | Product specifications and implementation plans |

## Lesson Content

Each canonical lesson lives under `lessons/<arc>/<lesson>/`:

```text
lesson.json
notes.md
starter/src/lib.rs
tests/public.rs
solution/src/lib.rs
```

`lesson.json` references source files instead of duplicating their contents. It
also defines ordering, instructions, hints, and one or more validation steps.
The source validator checks schema requirements, referenced paths, arc
continuity, dependency sets, and selected starter/solution invariants.

The generation pipeline:

```text
lessons/
  -> content:validate-source
  -> content:generate
  -> frontend/src/content/lessonIndex.json
  -> frontend/src/content/lessons.json
  -> frontend/src/content/concepts.json
  -> frontend/public/content/lessons/<lesson-id>.json
```

The index contains lightweight navigation metadata. Full lesson details are
separate files so the browser only loads them when needed. Author metadata,
notes, and complete reference solution directories are removed from shipped
lesson records. An explicitly authored final-hint solution snippet may be
included.

Relevant commands:

```bash
cd frontend
npm run content:validate-source
npm run content:generate
npm run content:check-refs
npm run content:check

cd ..
scripts/test-lesson-solutions.sh
```

`content:check-refs` is deliberately separate from schema validation. It checks
`arcs.json`, concept prerequisites, unique lesson order, and canonical
source-to-generated parity.

## Frontend

`frontend/src/App.tsx` is the application coordinator. It uses hash routes for
the home, lesson, and settings screens. Lesson screens and lesson detail JSON
are loaded lazily; the current and next lesson are prefetched.

The main lesson flow is:

1. Select the first incomplete lesson.
2. Fetch and normalize its detail record.
3. Restore the editable file from a local draft, or use starter code.
4. Save edits to `localStorage` after a short debounce.
5. Run the lesson's validation steps.
6. Record completion only after a passing or explicit self-check result.

The current editor supports one editable file. Other lesson files are displayed
read-only and are included when building validation requests.

### Validation

`frontend/src/validation/validationClient.ts` coordinates validation:

- `structural` checks run in a short-lived Web Worker.
- `backend-cargo-test` sends code and public tests to the Actix API.
- `all` runs configured checks concurrently and aggregates their results.
- A default Cargo compile test is added when a lesson only configures browser
  checks.

The worker is terminated after each result or timeout. Structural checks inspect
the source shape; they are fast feedback, not a Rust parser or compiler.
`browser-rust` exists in the schema but its compiler engine is not implemented.
All current lessons use `all` with structural and backend Cargo steps.

Backend responses are normalized into the frontend validation model. Cargo
compiler messages are rendered as diagnostics, while Cargo bookkeeping records
such as `compiler-artifact` are discarded.

### Browser Storage

The browser is the only persistence layer:

| Key | Contents |
| --- | --- |
| `rust-daily:v1:progress` | Attempts, completions, and concept progress |
| `rust-daily:v1:draft:<lesson-id>` | Editable lesson draft |
| `rust-daily:v1:settings` | Theme, editor font size, and motion preference |

Progress can be exported and imported as versioned JSON. Storage reads are
validated and fall back to defaults when data is missing or malformed.

### PWA Caching

Vite and Workbox generate the service worker. The production app precaches its
shell, uses cache-first handling for static assets, and network-first handling
for lesson detail JSON. Cargo-backed validation still requires the backend.

## Backend

The backend is an Actix application with three routes:

| Route | Purpose |
| --- | --- |
| `GET /healthz` | Service health |
| `POST /run` | Validate, compile, and test a lesson submission |
| `/*` | Serve the production frontend |

The `/run` path crosses these modules:

```text
api -> service -> model validation -> bounded queue
    -> runner worker -> temporary workspace -> Podman -> Cargo
```

- `api.rs` owns HTTP extraction and response mapping.
- `service.rs` coordinates validation and queue submission behind a queue port.
- `model.rs` owns accepted paths, size limits, dependency sets, and result
  types.
- `queue.rs` provides backpressure with a bounded Tokio channel and fixed
  worker count.
- `workspace.rs` creates an isolated Cargo project per request.
- `runner.rs` invokes Podman, applies timeouts, classifies Cargo output, caps
  diagnostics, and removes the temporary workspace.

The API currently accepts exactly two files:

```text
src/lib.rs
tests/lesson.rs
```

Requests select either the `std` or `advanced` dependency set. The frontend
combines authored public test files into `tests/lesson.rs` before submission.

Run results use one of these statuses:

```text
passed
failed
compile_error
timed_out
internal_error
```

Invalid payloads return structured `400` or `413` responses. A full queue
returns `429` immediately rather than allowing unbounded work.

## Runner Isolation

Each request gets a temporary host workspace mounted at `/workspace` in the
runner container. Podman starts the container with:

- no network;
- a read-only container filesystem;
- a bounded memory, CPU, and process count;
- dropped Linux capabilities;
- `no-new-privileges`;
- a small `noexec` temporary filesystem;
- inner and outer execution timeouts.

Cargo runs with `--offline`. The `std` set has no external dependencies. The
`advanced` set includes a predefined ecosystem surface, including Serde, Tokio,
tracing, thiserror, Actix, and proptest.

Advanced dependencies and compiled artifacts are cached in the runner image.
At runtime, the cached target directory is copied into the writable lesson
workspace before tests run. The dependency declarations in
`backend/src/model.rs`, `docker/rust-runner.Dockerfile`, and the solution test
harness must remain synchronized.

## Configuration

Backend settings are loaded in this order:

1. `config/default.yaml`
2. `config/<RUST_DAILY_ENV>.yaml`
3. `RUST_DAILY_*` environment overrides

Configuration controls the bind address, CORS origin, static frontend path,
queue size, worker count, runner timeout, output limit, image, workspace root,
and request size limits. Typed configuration rejects empty or zero-valued
settings that cannot operate safely.

Local development runs Vite and Actix on separate origins. Production uses one
origin, so the frontend posts to `/run` without production CORS configuration.

## Production Deployment

```mermaid
flowchart LR
    User --> Cloudflare
    Cloudflare --> Nginx
    Nginx --> Actix
    Actix --> Static[Vite production files]
    Actix --> Queue[Validation queue]
    Queue --> Podman[Rootless Podman]
```

Pushes to `main` trigger the VPS workflow in
`.github/workflows/deploy_dev.yml`. It builds the frontend and release backend,
copies them with configuration and runner assets, installs the systemd and
Nginx configuration, and restarts the service.

The workflow does not build the Podman runner image. That image is rebuilt
deliberately under the production service account when the Rust version,
dependency sets, Dockerfile, or runner entrypoint changes.

The live deployment is [borrowquest.qzz.io](https://borrowquest.qzz.io/).
Operational details are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Trust Model and Constraints

- User code is untrusted; the Podman runner is the host protection boundary.
- Public tests are shipped to the browser and submitted by the client. The
  service provides practice feedback, not tamper-resistant grading.
- The backend has no durable store for user code, progress, drafts, or
  accounts. Temporary source workspaces are removed after normal run cleanup.
- Lesson execution is limited to one editable library file and one combined
  test file.
- Offline mode supports the app shell, cached lessons, editing, and local
  state. It does not provide Cargo compilation.
- Adding a dependency set requires coordinated backend, image, harness, schema,
  and content updates.

Product behavior and curriculum requirements are defined in
[docs/SPEC.md](docs/SPEC.md). Future runner and curriculum evolution is defined
in
[docs/FUTURE_ADVANCED_CONCEPTS_IMPLEMENTATION_PLAN.md](docs/FUTURE_ADVANCED_CONCEPTS_IMPLEMENTATION_PLAN.md).
