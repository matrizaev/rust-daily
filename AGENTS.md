# Repository Guidelines

## Project Structure & Module Organization
This repository is organized as a workspace. Root files are repo/workspace concerns such as `.github/`, `.gitignore`, `AGENTS.md`, and `mise.toml`. The React app lives in `frontend/`; the Actix validation service lives in `backend/`; runner images and related assets live in `docker/`; canonical lesson sources live in `lessons/`; and maintained product and deployment documentation lives in `docs/`.

Inside `frontend/`, this is a Vite, React, and TypeScript PWA. `frontend/src/main.tsx` bootstraps React, and `frontend/src/App.tsx` owns top-level lesson routing. Reusable UI lives in `frontend/src/components/`, browser persistence is split across `frontend/src/storage/` and `frontend/src/progress/`, and shared types live in `frontend/src/types/`. Generated lesson indexes live in `frontend/src/content/`; generated lesson details live in `frontend/public/content/lessons/`. Treat `frontend/dist/`, `node_modules/`, generated content, and `*.tsbuildinfo` as generated files.

## Build, Test, and Development Commands
- `cd frontend && npm install`: install pinned dependencies from `frontend/package-lock.json`.
- `cd frontend && npm run dev`: start the Vite development server.
- `cd frontend && npm run build`: run the TypeScript project build and create the production bundle in `frontend/dist/`.
- `cd frontend && npm run preview`: serve the built bundle locally for smoke testing.
- `make dev-full`: build the Podman runner and start the frontend and backend.
- `make format`, `make lint`, and `make test`: format, lint, and test the backend.
- `make smoke-runner`: exercise the running backend through HTTP and Podman.
- `scripts/test-lesson-solutions.sh lessons`: run all authored solutions against public tests.

No frontend unit-test script exists yet. Before handing off frontend changes, run `cd frontend && npm run build` plus the required Fallow checks from `frontend/`: `yes | npx fallow dupes`, `yes | npx fallow dead-code`, and `yes | npx fallow health`.

## Coding Style & Naming Conventions
Use strict TypeScript and ES modules in `frontend/`. Keep React component files in PascalCase, such as `LessonScreen.tsx`; name hooks, callbacks, and helpers in camelCase, such as `handleRevealHint`; and keep CSS classes kebab-case. Follow the existing style: 2-space indentation, double quotes, semicolons, and explicit prop types near component definitions. Author lessons under `lessons/` and regenerate frontend content instead of editing generated JSON directly or hard-coding lesson text in components.

## Testing Guidelines
Backend unit tests are run by `make test`. Frontend unit tests are not configured; when adding them, colocate component tests as `ComponentName.test.tsx` or place broader tests under `frontend/src/__tests__/`. Prioritize hash routing, local persistence, lesson loading, and validation result mapping.

For lesson changes, run `cd frontend && npm run content:validate-source`, regenerate content with `npm run content:generate`, run the separate `npm run content:check-refs` and `npm run content:check` commands, and test the affected solutions from the repository root with `scripts/test-lesson-solutions.sh`.

Every lesson must expose exactly one editable artifact. Larger examples should supply all other project files as read-only context and compile them together; do not introduce multi-file learner editing.

## Commit & Pull Request Guidelines
Use clear imperative commit subjects, for example `Add lesson draft reset`. Keep subjects under about 72 characters and group related changes. Pull requests should include a short summary, validation steps, linked issue or spec section, and screenshots or short clips for UI changes. Call out content-schema, dependency-set, and runner-image changes explicitly.

## Security & Configuration Tips
Drafts are saved in browser `localStorage`; do not store secrets, tokens, or account data there. Submitted Rust is untrusted and must continue to run through the restricted rootless Podman boundary. Keep runtime configuration out of lesson content unless it is intentionally public.
