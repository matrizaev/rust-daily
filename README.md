# Rust Daily

Rust Daily is a local-first web app for practicing idiomatic Rust in focused
5-10 minute sessions.

It is designed for developers who know Rust's basic syntax and want to become
better at writing clear, production-quality code. The curriculum favors small,
realistic refactors over algorithm puzzles and teaches one idea at a time
through starter code, tests, hints, and an authored solution.

**Live app:** [borrowquest.qzz.io](https://borrowquest.qzz.io/)

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

cd frontend
npm run content:validate-source
npm run content:generate
npm run content:check-refs
npm run content:check
npm run build
yes | npx fallow dupes
yes | npx fallow dead-code
yes | npx fallow health
```

Lesson reference solutions can be checked with:

```bash
scripts/test-lesson-solutions.sh lessons
```

`content:check-refs` independently checks canonical arc references and verifies
that generated lessons and concepts match their sources.

With the backend running, smoke-test the real HTTP, queue, Podman, and Cargo
path:

```bash
make smoke-runner
make smoke-runner SMOKE_CASE=compile-error
make smoke-runner SMOKE_CASE=multi-file-pass
```

This target wraps `scripts/play_run.py`, which uses only the Python 3 standard
library. Supported cases are `pass`, `multi-file-pass`, `fail`,
`compile-error`, and `timeout`. Set `SMOKE_URL` to test another deployment.

## Documentation

- [Product specification](docs/SPEC.md)
- [System architecture](ARCHITECTURE.md)
- [Production deployment](docs/DEPLOYMENT.md)
- [Project snapshot validation spec](docs/PROJECT_SNAPSHOT_VALIDATION_SPEC.md)
- [Project snapshot validation implementation plan](docs/PROJECT_SNAPSHOT_VALIDATION_IMPLEMENTATION_PLAN.md)
- [Lessons 91-500 roadmap](docs/FUTURE_ADVANCED_CONCEPTS_IMPLEMENTATION_PLAN.md)

## Deployment

Production runs as one Actix service on a VPS. Actix serves the built PWA and
the `/run` API behind Nginx and Cloudflare. Pushes to `main` deploy through
GitHub Actions.
