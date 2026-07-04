# Milestone 1 Implementation Plan

## Goal

Build a static frontend prototype that proves the daily lesson loop works without a backend.

Milestone 1 should let a user:

- Open the app in a browser.
- See today's lesson from local lesson data.
- Edit Rust starter code in a touch-friendly editor.
- Save drafts locally.
- Reset the lesson to starter code.
- Reveal authored hints one at a time.

Milestone 1 does not need browser Rust validation, service worker caching, streaks, concept progress, accounts, sync, or installable PWA behavior.

## Recommended Stack

Use a small static frontend stack:

- Vite.
- TypeScript.
- React.
- CodeMirror 6 for the editor.
- Static JSON lesson files.
- LocalStorage for Milestone 1 draft persistence.

Reasoning:

- Vite keeps the app easy to run and easy to later build as static files.
- React is enough for the lesson/editor state model without heavy app structure.
- CodeMirror gives Rust syntax highlighting and touch-friendly editing while allowing autocomplete to be omitted.
- LocalStorage is sufficient for one lesson draft; IndexedDB can replace or supplement it in later milestones.

## Non-Goals

Do not implement:

- Rust compiler/checker integration.
- Web Worker validation.
- `cargo test`.
- Hidden or secret tests.
- Service worker offline caching.
- Streaks.
- Concept graph UI.
- Account management.
- Cloud sync.
- Multi-device storage.
- Import/export.
- Analytics.

## Proposed File Structure

```text
package.json
index.html
src/
  main.tsx
  App.tsx
  styles.css
  content/
    concepts.json
    lessons.json
  components/
    DailyHome.tsx
    LessonScreen.tsx
    CodeEditor.tsx
    HintPanel.tsx
    LessonActions.tsx
  storage/
    draftStore.ts
  types/
    lesson.ts
```

This structure keeps Milestone 1 flat. Add routing, IndexedDB, validation workers, and PWA files only when later milestones need them.

## Content Model

Create one sample concept and one sample lesson from the parse-user arc.

Lesson fields:

```ts
type Lesson = {
  id: string;
  arcId: string;
  arcTitle: string;
  day: number;
  arcLength: number;
  title: string;
  conceptId: string;
  difficulty: "easy" | "medium" | "advanced";
  estimatedMinutes: number;
  scenario: string;
  instructions: string;
  starterCode: string;
  hints: string[];
};
```

Initial lesson:

- Arc: `Parse a user from text`.
- Day: `1 / 7`.
- Concept: error enum design.
- Task: define `ParseUserError`.
- Starter code should be short enough to fit comfortably on a tablet.

## UI Plan

### Daily Home

Show:

- App title.
- Today's lesson title.
- Arc name and day count.
- Estimated duration.
- Concept name.
- Continue button.

Keep this screen compact. It should feel like a work surface, not a landing page.

### Lesson Screen

Show:

- Scenario.
- Exact task instruction.
- Code editor.
- Action bar.
- Hint area.

Actions:

- Reset.
- Hint.
- Disabled or placeholder Check button with text like `Validation arrives in Milestone 2`.

The editor is the main focus. Instructions should stay short.

## Editor Requirements

Use CodeMirror with:

- Rust syntax highlighting.
- Line numbers.
- Basic history.
- Bracket matching.
- Default font size around 16px.
- No autocomplete extension.
- No LSP diagnostics.
- No inline suggestions.
- No snippets.
- No AI controls.

Verification item: type a few Rust identifiers and confirm no completion popup appears.

## Draft Persistence

Use a versioned LocalStorage key:

```text
rust-daily:v1:draft:<lessonId>
```

Store:

```ts
type DraftRecord = {
  lessonId: string;
  code: string;
  updatedAt: string;
};
```

Behavior:

- Load draft if present.
- Fall back to starter code.
- Save on editor changes with a small debounce.
- Reset clears the draft and restores starter code.

## Implementation Steps

1. Scaffold the frontend.
   - Add Vite, TypeScript, React, and CodeMirror dependencies.
   - Add a basic static app shell.

2. Add static content.
   - Create `concepts.json`.
   - Create `lessons.json`.
   - Add the first parse-user lesson.

3. Build the screen flow.
   - Render Daily Home first.
   - Continue opens Lesson Screen.
   - Keep state in React for Milestone 1.

4. Build the editor.
   - Add CodeMirror.
   - Enable Rust highlighting.
   - Omit autocomplete and diagnostics extensions.
   - Apply tablet-friendly sizing.

5. Add local drafts.
   - Implement `draftStore.ts`.
   - Load draft on lesson open.
   - Save edits.
   - Reset draft.

6. Add hints.
   - Reveal hints one at a time.
   - Persisting revealed hints is optional for Milestone 1.

7. Polish responsive layout.
   - Test portrait tablet width.
   - Test landscape tablet width.
   - Test desktop width.
   - Ensure buttons are at least 44px high.

## Acceptance Criteria

Milestone 1 is complete when:

- The app runs locally in a browser.
- The app renders today's lesson from local JSON.
- The user can open the lesson and edit Rust starter code.
- Refreshing the page preserves the draft.
- Reset restores the original starter code.
- Hints reveal one at a time.
- No autocomplete, snippets, LSP diagnostics, AI UI, or ghost text appear.
- The layout is usable at tablet and desktop widths.
- The Check button does not pretend validation exists yet.

## Suggested Manual QA

Run through this checklist before moving to Milestone 2:

- Open the app on desktop.
- Open the app in a tablet-sized browser viewport.
- Type `ParseUserError` and confirm no autocomplete popup appears.
- Edit code, refresh, and confirm the draft is still present.
- Reset, refresh, and confirm starter code is restored.
- Reveal all hints and confirm they appear in order.
- Resize from portrait to landscape and confirm the editor remains usable.

## Handoff to Milestone 2

Milestone 1 should leave these seams ready for validation:

- A `Lesson` model with room for validation metadata.
- A `CodeEditor` component that exposes current code.
- A `LessonActions` component with a placeholder Check button.
- A simple place to display future diagnostics.

Milestone 2 can then replace the placeholder Check behavior with a Web Worker validation prototype.
