# Repository Guidelines

## Project Structure & Module Organization
This is a Vite, React, and TypeScript app. `src/main.tsx` bootstraps React, and `src/App.tsx` owns top-level lesson routing. Reusable UI lives in `src/components/`, browser draft persistence is in `src/storage/`, and shared lesson types are in `src/types/`. Lesson and concept data live in `src/content/*.json` and must match `src/types/lesson.ts`. Static assets go in `public/`. Treat `dist/`, `node_modules/`, and `*.tsbuildinfo` as generated files.

## Build, Test, and Development Commands
- `npm install`: install pinned dependencies from `package-lock.json`.
- `npm run dev`: start the Vite development server.
- `npm run build`: run the TypeScript project build and create the production bundle in `dist/`.
- `npm run preview`: serve the built bundle locally for smoke testing.

No `npm test` script exists yet. Before handing off changes, run `npm run build` plus the required Fallow checks: `yes | npx fallow dupes`, `yes | npx fallow dead-code`, and `yes | npx fallow health`.

## Coding Style & Naming Conventions
Use strict TypeScript and ES modules. Keep React component files in PascalCase, such as `LessonScreen.tsx`; name hooks, callbacks, and helpers in camelCase, such as `handleRevealHint`; and keep CSS classes kebab-case. Follow the existing style: 2-space indentation, double quotes, semicolons, and explicit prop types near component definitions. Prefer data-driven content changes in `src/content/` over hard-coded lesson text in components.

## Testing Guidelines
Automated tests are not configured. When adding them, colocate component tests as `ComponentName.test.tsx` or place broader tests under `src/__tests__/`. Prioritize coverage for hash-based lesson routing, `localStorage` draft persistence, and JSON lesson parsing. Until a test runner is added, document manual checks and run `npm run build`.

## Commit & Pull Request Guidelines
Git history is unavailable in this workspace, so use clear imperative commit subjects, for example `Add lesson draft reset`. Keep subjects under about 72 characters and group related changes. Pull requests should include a short summary, validation steps, linked issue or spec section, and screenshots or short clips for UI changes. Call out content-schema changes that require updates to `src/types/lesson.ts` or existing JSON.

## Security & Configuration Tips
Drafts are saved in browser `localStorage`; do not store secrets, tokens, or account data there. Keep runtime configuration out of committed content files unless it is intentionally public.
