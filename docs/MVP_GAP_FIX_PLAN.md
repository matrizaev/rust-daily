# MVP Gap Fix Implementation Plan

## Goal

Close the gaps between the current implementation and the MVP requirements in `SPEC.md`.

This plan focuses first on the MVP-blocking gaps:

- Dark tablet-first UI.
- GitHub Pages deployment.
- Progress export/import.
- Settings for theme, editor font size, reduced motion, and local data controls.
- Clear privacy/local-only product copy.
- Accessibility polish around contrast, focus, font sizing, and reduced motion.

Browser-compiled Rust validation is intentionally planned as a separate follow-up milestone because it is substantially larger than the portability and UX gaps.

## Current Baseline

Already implemented:

- Static Vite React app.
- PWA manifest, service worker, offline app shell, and update prompt.
- Local lesson content with 30 lessons and 30 concepts.
- Local drafts in `localStorage`.
- Local progress, attempts, completions, streak, and concept progress.
- CodeMirror Rust editor with syntax highlighting and no autocomplete extension.
- Structural and self-check browser validation through a Web Worker.
- `VITE_BASE_PATH` support for static subpath hosting.

Known gaps:

- App shell is light-first; only the editor is dark.
- No user settings model or settings screen.
- No export/import for progress.
- No global local data deletion.
- No GitHub Pages workflow.
- No deployment documentation.
- No browser Rust compiler/test runner.
- Daily scheduling is still minimal.
- Progress screen is still a compact summary, not a full view.
- Authoring checks do not compile starters or reference solutions.

## Proposed Milestone Split

### Milestone 6: MVP Hardening

Ship the missing MVP portability and UX features.

Includes:

- Dark-first visual system.
- Settings screen.
- Progress export/import.
- Local data deletion controls.
- GitHub Pages deployment workflow.
- Deployment documentation.
- Accessibility pass.

Excludes:

- Browser Rust compiler integration.
- Full spaced-repetition scheduling.
- Full concept graph.
- Authoring-only reference solutions.
- Notifications.

### Milestone 7: Browser Rust Validation

Introduce browser-compiled Rust validation for a small supported subset of lessons.

Includes:

- Validation engine research decision.
- Cached compiler/runtime asset loading.
- Worker-based browser Rust validation job.
- Timeout/error handling.
- Lesson metadata for browser-rust capable lessons.
- At least one lesson converted from structural validation to browser-rust.

### Milestone 8: Scheduler And Progress Depth

Replace the minimal lesson selector with daily scheduling behavior closer to the spec.

Includes:

- One lesson per local date behavior.
- Review due calculation.
- Continue-current-arc priority.
- Basic grace-day streak handling.
- Fuller progress screen.

### Milestone 9: Authoring Pipeline

Make content safer to expand.

Includes:

- Authoring-only reference solutions.
- Starter/solution checks.
- Validation bundle checks.
- Better content QA scripts.

## Milestone 6 Detailed Plan

### 1. Add Settings Storage

Create `frontend/src/storage/settingsStore.ts`.

Recommended type:

```ts
export type ThemePreference = "dark" | "light" | "system";

export type UserSettings = {
  version: 1;
  theme: ThemePreference;
  editorFontSize: number;
  reducedMotion: boolean;
};
```

Behavior:

- Default `theme` should be `"dark"`.
- Default `editorFontSize` should be `16`.
- Default `reducedMotion` should follow `prefers-reduced-motion` when no saved setting exists.
- Clamp editor font size to a tablet-friendly range, for example `14` through `22`.
- Invalid stored settings should fall back to defaults.
- Store settings in `localStorage` under a versioned key such as `rust-daily:v1:settings`.

### 2. Apply Theme And Motion Preferences

Update `frontend/src/App.tsx` to:

- Load settings on startup.
- Apply `data-theme="dark"` or `data-theme="light"` to the app root or `document.documentElement`.
- Apply `data-reduced-motion="true"` when reduced motion is enabled.
- Pass `editorFontSize` into `LessonScreen` and `CodeEditor`.

Theme behavior:

- `"dark"` forces dark tokens.
- `"light"` forces light tokens.
- `"system"` resolves through `window.matchMedia("(prefers-color-scheme: dark)")`.
- System theme changes should update the effective theme while the app is open.

### 3. Convert CSS To Dark-First Tokens

Update `frontend/src/styles.css`.

Requirements:

- `:root` should use dark-first tokens.
- Add light overrides through `[data-theme="light"]`.
- Keep `color-scheme` aligned with the effective theme.
- Ensure the editor, validation panel, hints, progress summary, and PWA status all work in dark mode.
- Preserve tablet-first spacing and 44 px minimum tap targets.
- Keep focus indicators visible on both themes.

Recommended dark token direction:

```css
:root {
  color-scheme: dark;
  --background: #111412;
  --surface: #181d1a;
  --surface-strong: #202721;
  --border: #334137;
  --text: #f1f5ef;
  --muted: #aab5aa;
  --accent: #ffb454;
  --accent-strong: #ffd28a;
  --danger: #ff8a80;
  --success: #7bd88f;
}
```

Do not make the app a one-note palette. Use restrained accent colors for state and action, not a single hue across every surface.

### 4. Update PWA Theme Colors

Update:

- `frontend/index.html`.
- `frontend/vite.config.ts`.

Requirements:

- Use a dark default `theme-color`.
- Use media-specific `theme-color` tags if desired:
  - dark: dark background token.
  - light: light background token.
- Set PWA manifest `theme_color` and `background_color` to dark-first values.

### 5. Make Editor Font Size Configurable

Update `frontend/src/components/CodeEditor.tsx`.

Requirements:

- Accept `fontSize: number`.
- Use that value in the CodeMirror theme.
- Keep line height readable.
- Preserve no-autocomplete behavior.
- Avoid adding completion-related CodeMirror extensions.

### 6. Add Settings Screen

Create `frontend/src/components/SettingsScreen.tsx`.

Route it with hash navigation:

- `#settings` opens settings.
- Empty hash opens Daily Home.
- Existing `#lesson/:id` behavior remains unchanged.

Settings controls:

- Theme segmented control: Dark, Light, System.
- Editor font size stepper or slider.
- Reduced motion toggle.
- Export progress button.
- Import progress button.
- Delete local progress button.
- Delete all drafts button.

UX rules:

- Settings should be a real app view, not a modal inside another card.
- Controls must have clear labels and accessible names.
- Destructive controls should require a browser `confirm` or a small in-view confirmation step.
- Privacy copy should be short and explicit: code, drafts, and progress stay in this browser unless the user exports a file.

### 7. Implement Progress Export/Import

Create `frontend/src/storage/progressPortability.ts` or add focused functions to `frontend/src/progress/progressStore.ts`.

Export:

- Serialize the current `ProgressStore`.
- Include exported timestamp and app data version.
- Download as JSON using a `Blob` and temporary object URL.
- Suggested filename: `rust-daily-progress-YYYY-MM-DD.json`.

Import:

- Read a selected JSON file.
- Validate with the existing progress type guards.
- Replace current progress only after validation succeeds.
- Refresh app progress state after import.
- Show a clear error for invalid files.

Recommended export format:

```json
{
  "kind": "rust-daily-progress-export",
  "version": 1,
  "exportedAt": "2026-07-04T00:00:00.000Z",
  "progress": {}
}
```

Do not export drafts in Milestone 6 unless the UI clearly labels that behavior. The MVP spec only requires progress export/import.

### 8. Add Local Data Deletion

Update storage modules:

- Add `clearAllDrafts()` to `frontend/src/storage/draftStore.ts`.
- Keep `resetProgress()` for progress.
- Add settings reset only if the settings UI needs it.

Implementation detail:

- Draft keys already share the `rust-daily:v1:draft` prefix.
- `clearAllDrafts()` can iterate `localStorage` keys and remove matching draft keys.
- Use a snapshot of keys before removing to avoid index shifting bugs.

### 9. Add GitHub Pages Deployment

Create `.github/workflows/deploy.yml`.

Recommended behavior:

- Trigger on push to `main`.
- Allow manual `workflow_dispatch`.
- Use Node from the current project tooling.
- Run `npm ci`.
- Run `npm run content:check` from `frontend/`.
- Run `npm run build` from `frontend/` with `VITE_BASE_PATH=/rust-daily/` for the default project-pages path.
- Upload `dist` as a Pages artifact.
- Deploy with GitHub Pages actions.

Important:

- If the repository is deployed to a custom domain at the root, `VITE_BASE_PATH=/` is correct.
- If deployed to `https://USER.github.io/rust-daily/`, `VITE_BASE_PATH=/rust-daily/` is correct.

Add a short deployment note to `docs/DEPLOYMENT.md`.

The deployment note should include:

- How to enable GitHub Pages from GitHub Actions.
- The default project-pages base path.
- How to switch to a custom domain.
- Where to set the custom domain in GitHub Pages.
- That no backend is required.

### 10. Accessibility And Tablet QA Pass

Requirements:

- Verify controls are keyboard reachable.
- Add visible focus states where missing.
- Confirm status messages do not rely on color alone.
- Confirm validation diagnostics are selectable.
- Confirm tap targets remain at least 44 px.
- Confirm text does not overflow on tablet portrait width.
- Respect `prefers-reduced-motion` and the saved reduced-motion setting.

Manual viewport checks:

- 768 x 1024 tablet portrait.
- 1024 x 768 tablet landscape.
- 390 x 844 narrow mobile.
- 1280 x 800 desktop.

## Milestone 6 Acceptance Criteria

- App opens in dark mode by default.
- User can switch between Dark, Light, and System themes.
- PWA browser chrome uses a dark default theme color.
- Editor font size can be adjusted without layout breakage.
- Reduced motion can be enabled.
- User can export progress JSON.
- User can import a valid progress JSON and see progress update.
- Invalid import files are rejected without deleting current progress.
- User can delete local progress.
- User can delete all drafts.
- Settings explain that code, drafts, and progress stay local.
- GitHub Pages workflow exists and builds the static app.
- `cd frontend && VITE_BASE_PATH=/rust-daily/ npm run build` succeeds.
- `cd frontend && npm run content:check` succeeds.
- `cd frontend && npm run build` succeeds.
- Fallow checks pass:
  - `cd frontend && yes | npx fallow dupes`
  - `cd frontend && yes | npx fallow dead-code`
  - `cd frontend && yes | npx fallow health`

## Suggested Implementation Order

1. Add settings types and storage.
2. Wire settings through `App`.
3. Convert CSS to dark-first tokens.
4. Pass editor font size into CodeMirror.
5. Add settings route and settings screen.
6. Implement progress export/import.
7. Implement all-drafts deletion.
8. Update PWA theme colors.
9. Add GitHub Pages workflow and deployment docs.
10. Run build, content check, Fallow checks, and viewport smoke checks.

## Risks And Mitigations

Risk: Theme conversion causes broad visual regressions.

Mitigation:

- Convert tokens first.
- Avoid large component rewrites.
- Verify the home screen, lesson screen, validation panel, completion panel, and settings screen in both themes.

Risk: Importing progress corrupts local state.

Mitigation:

- Reuse strict progress validation before saving.
- Never clear current progress until the import file has been parsed and validated.
- Keep import to progress only, not drafts or settings.

Risk: GitHub Pages path breaks PWA assets.

Mitigation:

- Keep Vite `base` driven by `VITE_BASE_PATH`.
- Keep manifest `start_url` and `scope` relative.
- Build once with `/` and once with `/rust-daily/`.

Risk: Settings route conflicts with lesson hash routing.

Mitigation:

- Parse route as a small discriminated union:
  - `{ kind: "home" }`
  - `{ kind: "settings" }`
  - `{ kind: "lesson", lessonId: string }`

## Out Of Scope For Milestone 6

- `rustc` or Cargo in the browser.
- Hidden tests.
- Server validation.
- Accounts or cloud sync.
- Notifications.
- Full spaced repetition.
- Full concept graph visualization.
- Lesson authoring solution files.
