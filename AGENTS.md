# Repository Guidelines

## Scope & Local Instructions
This root guide applies to the whole repository. More specific instructions live
in subdirectories and take precedence for files under that tree:

- `backend/AGENTS.md`: Rust, Actix, runner, and backend architecture rules.
- `frontend/AGENTS.md`: React, TypeScript, PWA, browser storage, and content UI rules.

Keep root guidance about workspace structure, lesson authoring, validation, and
cross-cutting repository practices.

## Project Structure & Module Organization
This repository is organized as a workspace. Root files are repo/workspace
concerns such as `.github/`, `.gitignore`, `AGENTS.md`, `Makefile`, and
`mise.toml`. The React PWA lives in `frontend/`; the Actix validation service
lives in `backend/`; runner images and related assets live in `docker/`;
canonical lesson sources live in `lessons/`; and maintained product,
curriculum, and deployment documentation lives in `docs/`.

Treat these as generated or dependency output unless a task explicitly targets
them: `frontend/dist/`, `frontend/node_modules/`, `backend/target/`,
`frontend/src/content/*.json`, `frontend/public/content/lessons/*.json`,
coverage output, and `*.tsbuildinfo`.

## Common Commands
- `make dev-full`: build the Podman runner and start frontend and backend.
- `make format`, `make lint`, `make test`: format, lint, and test the backend.
- `make smoke-runner`: exercise the running backend through HTTP and Podman.
- `cd frontend && npm install`: install pinned frontend dependencies.
- `cd frontend && npm run dev`: start the Vite development server.
- `cd frontend && npm run build`: type-check and build the frontend.
- `cd frontend && npm run test`: run frontend Vitest tests.
- `cd frontend && npm run preview`: serve the built frontend locally.
- `scripts/curriculum/author-check`: run the normal local authoring gate.
- `scripts/curriculum/validate-source`: validate canonical lesson sources.
- `scripts/curriculum/generate --check`: verify generated content parity without writes.
- `scripts/curriculum/check-generated`: run generated parity, refs, and runtime content checks.
- `scripts/test-lesson-solutions.sh lessons`: run all authored lesson solutions.

## Lesson Authoring Rules
Author lessons under `lessons/` and regenerate frontend content; do not edit
generated lesson JSON directly as the source of truth. A lesson may compile a
multi-file project snapshot, but it must expose exactly one editable artifact.
All other project files should be read-only context or tests.

Lessons should mimic plausible work a Rust engineer might encounter in a real
project. Avoid contrived data shapes, throwaway helper APIs, tuple/string maps,
or toy workflows that exist only to demonstrate syntax. Prefer scenarios around
validation, conversion, parsing, configuration, service boundaries, persistence,
collection handling, request/response mapping, and error propagation. When a
domain type already exists in an arc, continue using it instead of switching to
ad hoc structures.

For lesson changes, run:

```text
scripts/curriculum/validate-source
scripts/curriculum/generate
scripts/curriculum/check-generated
scripts/test-lesson-solutions.sh lessons/<affected-arc-or-lesson>
```

For quick changed-work feedback, use `scripts/curriculum/author-check`; it
validates source, checks generated parity, checks generated content, and runs
changed lesson solutions against `origin/main`.

If source validation or scaffolding scripts changed, also run:

```text
cd frontend && npm run content:scaffold-lesson:test
cd frontend && npm run content:validate-source:test
```

## Validation Expectations
- Backend changes: run `make format`, `make lint`, and `make test`.
- Frontend changes: run `cd frontend && npm run build`, `npm run test`, and the
  required Fallow checks from `frontend/`: `yes | npx fallow dupes`,
  `yes | npx fallow dead-code`, and `yes | npx fallow health`.
- Lesson/content changes: run the content pipeline and affected lesson solution
  tests listed above.
- Runner, Docker, config, or deployment changes: run the relevant backend checks
  plus `make smoke-runner` when the local environment can run Podman.
- Docs-only changes: do not run full format/lint/test suites unless executable
  examples, generated docs, build configuration, or code/content behavior
  changed. Run `git diff --check`; report broader checks as not run.

## Commit & Pull Request Guidelines
Use clear imperative commit subjects, for example `Add lesson draft reset`.
Keep subjects under about 72 characters and group related changes. Pull
requests should include a short summary, validation steps, linked issue or spec
section, and screenshots or short clips for UI changes. Call out content-schema,
dependency-set, runner-image, and deployment changes explicitly.

## Security & Configuration Tips
Drafts are saved in browser `localStorage`; do not store secrets, tokens, or
account data there. Submitted Rust is untrusted and must continue to run through
the restricted rootless Podman boundary. Keep runtime configuration out of
lesson content unless it is intentionally public.
