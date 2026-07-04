# Repository Guidelines

## Project Structure & Module Organization
This repository is organized as a workspace. Root files are repo/workspace concerns such as `.github/`, `.gitignore`, `AGENTS.md`, and `mise.toml`. The React app lives in `frontend/`; future Actix backend code lives in `backend/`; runner images and related assets live in `docker/`; specs, plans, and product notes live in `docs/`.

Inside `frontend/`, this is a Vite, React, and TypeScript app. `frontend/src/main.tsx` bootstraps React, and `frontend/src/App.tsx` owns top-level lesson routing. Reusable UI lives in `frontend/src/components/`, browser draft persistence is in `frontend/src/storage/`, and shared lesson types are in `frontend/src/types/`. Lesson and concept data live in `frontend/src/content/*.json` and must match `frontend/src/types/lesson.ts`. Static assets go in `frontend/public/`. Treat `frontend/dist/`, `node_modules/`, and `*.tsbuildinfo` as generated files.

## Build, Test, and Development Commands
- `cd frontend && npm install`: install pinned dependencies from `frontend/package-lock.json`.
- `cd frontend && npm run dev`: start the Vite development server.
- `cd frontend && npm run build`: run the TypeScript project build and create the production bundle in `frontend/dist/`.
- `cd frontend && npm run preview`: serve the built bundle locally for smoke testing.

No `npm test` script exists yet. Before handing off frontend changes, run `cd frontend && npm run build` plus the required Fallow checks from `frontend/`: `yes | npx fallow dupes`, `yes | npx fallow dead-code`, and `yes | npx fallow health`.

## Coding Style & Naming Conventions
Use strict TypeScript and ES modules in `frontend/`. Keep React component files in PascalCase, such as `LessonScreen.tsx`; name hooks, callbacks, and helpers in camelCase, such as `handleRevealHint`; and keep CSS classes kebab-case. Follow the existing style: 2-space indentation, double quotes, semicolons, and explicit prop types near component definitions. Prefer data-driven content changes in `frontend/src/content/` over hard-coded lesson text in components.

## Testing Guidelines
Automated tests are not configured. When adding them, colocate component tests as `ComponentName.test.tsx` or place broader tests under `frontend/src/__tests__/`. Prioritize coverage for hash-based lesson routing, `localStorage` draft persistence, and JSON lesson parsing. Until a test runner is added, document manual checks and run `cd frontend && npm run build`.

## Commit & Pull Request Guidelines
Git history is unavailable in this workspace, so use clear imperative commit subjects, for example `Add lesson draft reset`. Keep subjects under about 72 characters and group related changes. Pull requests should include a short summary, validation steps, linked issue or spec section, and screenshots or short clips for UI changes. Call out content-schema changes that require updates to `frontend/src/types/lesson.ts` or existing JSON.

## Security & Configuration Tips
Drafts are saved in browser `localStorage`; do not store secrets, tokens, or account data there. Keep runtime configuration out of committed content files unless it is intentionally public.
