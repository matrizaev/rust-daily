# Frontend Guidelines

## Scope
These instructions apply to `frontend/`: the Vite React PWA, TypeScript types,
browser validation, local storage, generated runtime content, PWA behavior, and
curriculum scripts under `frontend/scripts/`.

## Architecture Boundaries
- Keep `src/App.tsx` as the application coordinator for routing, page-level
  state, lazy loading, and top-level navigation. If it grows new feature logic,
  extract focused hooks or helpers near the owning domain.
- Keep route screens and reusable UI in `src/components/`. Component files use
  PascalCase; hooks, callbacks, and helpers use camelCase; CSS classes use
  kebab-case.
- Keep browser persistence split by domain: drafts in `src/storage/`, progress
  in `src/progress/`, settings in `src/storage/settingsStore.ts`, and shared
  types in `src/types/`.
- Keep validation orchestration in `src/validation/validationClient.ts`,
  backend transport mapping in `src/validation/backendValidation.ts`, and
  worker-only structural checks in `src/validation/validationWorker.ts` and
  `src/validation/structuralChecks.ts`.
- Treat `src/content/*.json` and `public/content/lessons/*.json` as generated
  runtime content. Change canonical lesson sources under `../lessons/`, then
  regenerate.

## React & TypeScript Style
- Use strict TypeScript and ES modules. Prefer explicit prop types near
  component definitions.
- Follow existing formatting: 2-space indentation, double quotes, semicolons.
- Keep components focused on rendering and local interaction. Move persistence,
  validation, routing, and content transformation into hooks/helpers with clear
  names.
- Prefer derived state with `useMemo` only when it prevents meaningful repeated
  work or keeps dependency flow clear. Do not add memoization by default.
- Use `useCallback` for callbacks passed to memoized/lazy child components or
  effect dependencies; avoid blanket wrapping when identity does not matter.
- Avoid mutating imported lesson/content data. Normalize or copy into local
  structures when transformation is needed.
- Model UI states as discriminated unions when they have distinct behavior
  (`idle`, `running`, `result`, error states) instead of loosely coupled boolean
  flags.
- Keep browser APIs behind small helpers where possible so tests can cover
  fallback behavior and malformed storage data.

## UI & Interaction Rules
- Build the actual app/tool surface, not a marketing page. Rust Daily is a
  focused learning app, so prioritize legible lesson flow, editor ergonomics,
  clear validation feedback, and progress visibility.
- Use existing CSS conventions and component patterns before adding new visual
  systems.
- Use lucide icons for recognizable actions when an icon is useful. Pair icons
  with text when clarity matters.
- Ensure text fits on mobile and desktop. Avoid fragile fixed heights for
  dynamic content.
- Read-only lesson files should stay clearly separate from the single editable
  artifact.
- Do not add visible explanatory text about implementation mechanics unless it
  helps the learner complete the current workflow.

## Content & Curriculum Scripts
- Canonical source lives in `../lessons/`. Runtime JSON in `src/content/` and
  `public/content/lessons/` must be generated from source.
- Source validation should enforce real curriculum contracts, not paper over bad
  lessons. Prefer rejecting invalid source over silently normalizing it.
- Lesson scenarios should resemble plausible real project work. Avoid ad hoc
  tuple/string maps or helper APIs invented only to teach syntax.
- Every lesson must expose exactly one editable artifact. Larger examples should
  provide other source, fixtures, test data, and tests as read-only context.
- Keep structural checks focused. They are fast feedback, not a Rust parser or
  compiler; backend Cargo validation is the authority for Rust correctness.
- When editing generation or validation scripts, keep file writes staged or
  atomic and preserve source-to-generated parity checks.

## Testing Guidelines
For frontend code changes, run from `frontend/`:

```text
npm run build
npm run test
yes | npx fallow dupes
yes | npx fallow dead-code
yes | npx fallow health
```

For content or lesson changes, also run:

```text
npm run content:validate-source
npm run content:generate
npm run content:check-refs
npm run content:check
```

Then run affected lesson solution tests from the repository root:

```text
scripts/test-lesson-solutions.sh lessons/<affected-arc-or-lesson>
```

For script changes under `frontend/scripts/curriculum/`, include the relevant
script tests:

```text
npm run content:scaffold-lesson:test
npm run content:validate-source:test
```

For docs-only changes, run `git diff --check` and skip the frontend suite unless
the docs change includes executable examples, generated docs, build
configuration, or code/content behavior changes.
