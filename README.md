# Rust Daily

Rust Daily is a local-first web app for practicing idiomatic Rust in focused
5-10 minute sessions.

It is designed for developers who know Rust's basic syntax and want to become
better at writing clear, production-quality code. The curriculum favors small,
realistic refactors over algorithm puzzles and teaches one idea at a time
through starter code, tests, hints, and an authored solution.

**Live app:** [borrowquest.site](https://borrowquest.site/)

## What It Teaches

The current curriculum contains 90 lessons across 15 progressive arcs. It
covers ownership and borrowing, domain modeling, iterators, error design,
conversions, API boundaries, testing, async Rust, structured logging, and
selected ecosystem crates such as Tokio, Serde, thiserror, tracing, and Actix.
The maintained roadmap grows this foundation toward a 500-lesson curriculum.

Rust Daily is intentionally not an AI tutor or a general-purpose code judge.
It provides no AI-generated solutions or autocomplete. A final hint may reveal
the authored reference approach. Validation is deterministic, using browser
checks and Cargo tests executed by the backend in an isolated container.

## How It Works

- `frontend/` contains the React, TypeScript, and Vite PWA.
- `backend/` contains the Actix service used for Cargo-backed validation.
- `docker/` contains the restricted Rust runner image and cached dependency
  sets.
- `lessons/` contains lesson source, starter code, public tests, and reference
  solutions.
- `docs/` contains the product specification, curriculum plans, and deployment
  documentation.

Progress and drafts remain in browser storage. No account or cloud sync is
required. The installed app and cached lessons remain available offline, but
Cargo validation requires the backend.

The curriculum design allows realistic multi-file projects, but exactly one
file is editable in each lesson. Other project files and tests are supplied as
read-only context and compiled together. When an arc moves to another file, the
next lesson includes the authored solution from the previous day as read-only
project code. The runner accepts a backend-controlled single-crate project
snapshot: `src/**/*.rs`, `tests/**/*.rs`, `fixtures/**`, and `testdata/**`.
The generated `Cargo.toml` remains controlled by the backend dependency set.
Backend validation runs under one request deadline in a managed rootless Podman
container with bounded output, diagnostics, workspace tmpfs, CPU, memory, and
processes. Lessons can also attach public compile-fail cases to prove that
invalid API uses are rejected by structured rustc diagnostics.

## Run Locally

The full stack requires Node.js 24, Rust 1.95, and Podman.

```bash
cd frontend
npm install
cd ..
make dev-full
```

This builds the runner image, starts the Actix backend at
`http://127.0.0.1:8080`, and starts the Vite app at
`http://localhost:5173`.

For frontend-only development:

```bash
cd frontend
npm run dev
```

## Validate Changes

```bash
make format
make lint
make test
make coverage

cd frontend
npm run content:validate-source:test
npm run build
yes | npx fallow dupes
yes | npx fallow dead-code
yes | npx fallow health

cd ..
scripts/curriculum/validate-source
scripts/curriculum/generate --check
scripts/curriculum/check-generated
```

Lesson reference solutions can be checked with:

```bash
scripts/test-lesson-solutions.sh lessons
scripts/test-lesson-solutions.sh --changed --jobs 4
```

`scripts/curriculum/check-generated` checks generated parity, canonical arc
references, and runtime content shape.

## Author Lessons

Create a new source lesson skeleton with:

```bash
scripts/curriculum/scaffold-lesson \
  --arc advanced-ownership \
  --lesson 091-borrowed-config-view \
  --title "Borrowed config views" \
  --concept borrowed-config-view \
  --difficulty medium \
  --dependency-set std \
  --editable src/lib.rs \
  --preset advanced-borrowed-api \
  --register-arc \
  --arc-title "Advanced ownership and API design" \
  --arc-pillar ownership \
  --arc-description "Design APIs with deliberate ownership, borrowing, and allocation." \
  --register-concept
```

The scaffolder enforces sequential lesson order, exactly one editable artifact,
safe runner paths, optional compile-fail cases, and read-only continuity copies
from the previous lesson's solution snapshot. Replace every `TODO(author)`
placeholder, then run `scripts/curriculum/author-check`.

With the backend running, smoke-test the real HTTP, queue, Podman, and Cargo
path:

```bash
make smoke-runner
make smoke-runner SMOKE_CASE=compile-error
make smoke-runner SMOKE_CASE=multi-file-pass
make smoke-runner SMOKE_CASE=compile-fail-pass
```

This target wraps `scripts/play_run.py`, which uses only the Python 3 standard
library. Supported cases are `pass`, `multi-file-pass`, `fail`,
`compile-error`, `timeout`, `compile-fail-pass`,
`compile-fail-unexpected-pass`, and `compile-fail-wrong-diagnostic`. Set
`SMOKE_URL` to test another deployment.

## Documentation

- [Product specification](docs/SPEC.md)
- [System architecture](ARCHITECTURE.md)
- [Production deployment](docs/DEPLOYMENT.md)
- [Lessons 91-500 roadmap](docs/FUTURE_ADVANCED_CONCEPTS_IMPLEMENTATION_PLAN.md)

## Deployment

Production runs as one Actix service on a VPS. Actix serves the built PWA,
handles `POST /run`, and exposes `GET /healthz`, `GET /readyz`, and
`GET /metrics` behind Nginx and Cloudflare. Metrics are controlled by backend
configuration and may require authorization. Pushes to `main` deploy through
GitHub Actions.
