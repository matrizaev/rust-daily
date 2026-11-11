# Playground Feature Specification

Status: implemented; frontend gates and browser smoke passed.

## Purpose

Playground lets a learner open and work through a lesson that is not part of
Rust Daily's authored curriculum. A shared link carries the public lesson
payload; Rust Daily renders it in the existing lesson workspace and submits
supported checks through the existing validation flow.

Playground is a practice surface, not a curriculum authoring system. A
repository-local agent skill authors public lesson payloads and turns them into
share links; the app itself does not author or generate lessons. Working on a
Playground lesson must never create or change curriculum progress.

## Goals

- Provide a visible Playground entry in the app and a direct route for shared
  lesson links.
- Render valid ad-hoc lessons with the same editor, lesson brief, hints,
  read-only context, and validation feedback as authored lessons.
- Support the public lesson payload schema already used by runtime lessons.
- Allow supported backend validation to use the existing restricted runner.
- Isolate Playground activity from all progress records and curriculum state.
- Handle missing, invalid, and oversized payloads without falling back to an
  unrelated daily lesson.
- Provide an agent workflow for authoring a lesson payload and producing a
  Playground link.

## Non-Goals

- Creating or editing lesson definitions inside Rust Daily.
- Generating, hosting, or shortening share links in the app UI.
- Adding curriculum entries, concepts, prerequisites, or progression for
  Playground lessons.
- Adding backend validation modes, dependencies, or execution capabilities.
- Treating Playground results as secure grading or certification.

## User Workflows

### Open Playground

1. The learner selects the visible Playground link from the app's shared site
   navigation.
2. The app opens the Playground route.
3. If no lesson payload is present, the app opens a scratch workspace with a
  Rust editor and an action to submit the code to the configured backend.
  Scratch validation compiles the project and runs a no-assertion test
  harness; it does not claim to verify behavioral correctness.

### Open A Shared Lesson

1. An agent uses the repository-local Playground lesson skill to author a
  complete public `Lesson` payload and produce a link.
2. The learner opens the link containing the Playground lesson payload.
3. The app decodes and validates the payload before rendering any lesson data.
4. A valid payload opens the existing lesson workspace in Playground mode.
5. The learner edits the designated file, reveals hints, and runs supported
   validation, including backend submission when configured.
6. Validation results and completion explanation are shown in the workspace.
   No attempt, hint, or completion is recorded in curriculum progress.

## Route And Payload Contract

- Playground uses the existing client-side hash routing and supports direct
  links and browser refresh. The route is `#playground`; a lesson link carries
  one `lesson` parameter, for example:

  ```text
  https://borrowquest.site/#playground?lesson=<base64url-encoded-json>
  ```

- The parameter is base64url-encoded UTF-8 JSON representing one complete
  public runtime `Lesson` record. It uses the same supported schema versions
  and fields as authored lesson content, including its validation definition.
- The decoded JSON is limited to 32 KiB. Duplicate `lesson` parameters,
  malformed encoding, invalid JSON, unsupported schema versions, and invalid
  lesson records are rejected with a user-readable error.
- The lesson's supplied ID is preserved for display and validation. It is not
  used as a progress or draft-storage identity.
- A stable fingerprint is computed from canonicalized complete payload JSON
  (object keys sorted, array order preserved). Playground drafts use a
  `playground:<fingerprint>` key, so identical payloads restore the same draft
  and distinct payloads never share a draft.
- The record must satisfy the existing lesson contract, including exactly one
  editable file and unique safe relative file paths. Existing validation
  modes are passed through the current validation machinery. This includes
  structural, self-check, backend Cargo, and compile-fail checks; the existing
  `browser-rust` unsupported result remains visible. Unknown or malformed
  validation modes are rejected. Author-only notes and reference solutions
  are not part of the public payload.
- An invalid payload never falls back to a daily or canonical lesson. The
  error state offers a return-home action and does not attempt validation.
- The URL fragment is client-side state and is not sent as part of normal HTTP
  requests. The app does not log the payload or send it to any service other
  than the existing validation endpoint when the learner explicitly runs a
  supported backend check.

## Functional Requirements

### Navigation And Workspace

- A visible link labeled “Playground” is available in shared site navigation
  from the home and lesson experiences, in the existing site footer.
- Opening `#playground` without a lesson payload shows a clear empty state and
  scratch editor using the existing lesson workspace and validation flow.
- The scratch editor can submit code through the configured backend and clearly
  states that the result verifies compilation only, not behavioral correctness.
- Opening a valid shared link displays the same lesson workspace and core
  controls as an authored lesson.
- Playground mode is visibly distinguishable from a curriculum lesson so the
  learner understands that progress is not being recorded.
- Settings and return-home navigation remain available. Playground does not
  show a next-curriculum-lesson action.
- The workspace honors the same editor settings, keyboard access, responsive
  behavior, reduced-motion preference, and accessible validation status as the
  authored lesson workspace.

### Validation And Safety

- Structural checks run in the browser through the existing validation
  orchestration.
- Backend Cargo tests and compile-fail checks use the existing backend request
  format, allowlists, limits, dependency sets, bounded queue, and restricted
  Podman execution. Playground does not introduce a separate runner path.
- Self-check and other supported modes retain their existing behavior.
  `browser-rust` displays the existing unsupported result; unknown or
  malformed validation modes are rejected during payload validation.
- All payload strings, paths, files, and validation configuration are
  untrusted. The client must validate the payload before rendering or
  submitting it; the backend remains authoritative for request and execution
  safety.
- A failed payload check produces a bounded, actionable error state and never
  partially renders or executes the payload.

### Progress And Persistence

- Playground must not create or update lesson attempts, hint-reveal counts,
  completions, concept state, streaks, daily selection, or curriculum summary.
- Passing a Playground check may show the validation success and lesson
  explanation, but it does not mark the lesson complete in progress UI or
  storage.
- Playground draft saving reuses the existing local draft behavior under a
  stable `playground:<fingerprint>` identity derived from the canonicalized
  complete payload. A payload whose ID matches an authored lesson must not
  read, overwrite, or delete that lesson's draft.
- The no-payload scratch workspace uses the separate stable draft identity
  `playground:scratch`.
- Reopening the same valid shared payload restores its Playground draft;
  changing any payload content selects a separate draft.
- Revealed hint count is session-only and resets when the Playground lesson is
  reopened; it is not added to progress or draft storage.
- Progress export/import and curriculum selectors exclude all Playground
  activity.

## Acceptance Criteria

- The Playground navigation link opens the `#playground` route, and the route
  remains valid after refresh.
- Opening a valid link with a complete supported lesson payload displays its
  title, task, files, hints, and supported checks in the lesson workspace.
- Editing and running browser checks works without writing curriculum
  progress.
- A backend-enabled Playground lesson submits through the existing validation
  client and receives normal backend results.
- Completing a Playground lesson, revealing hints, and running failed or
  successful checks leave progress storage byte-for-byte unchanged and do not
  change the selected daily lesson or progress summary.
- A Playground lesson whose ID equals a canonical lesson ID cannot read or
  modify that lesson's progress or draft.
- Identical canonical payloads restore the same Playground draft; distinct
  payloads remain isolated even when their lesson IDs and editable paths are
  equal.
- Missing payload opens the scratch workspace. Duplicate, malformed,
  unsupported, invalid, and over-limit payloads show an error state, do not load
  the scratch or a canonical lesson, do not submit to the backend, and do not
  write progress.
- Shared links work on desktop and mobile layouts and retain keyboard and
  assistive-technology access to navigation, editor actions, and validation
  results.

## Product Constraints

- The public runtime lesson schema remains the single source of truth for
  payload shape; no parallel Playground lesson schema is introduced.
- A Playground lesson is ephemeral with respect to curriculum progression,
  regardless of its supplied ID or validation outcome.
- Backend execution remains an untrusted-code boundary. A payload cannot
  supply a Cargo manifest, arbitrary runner command, or unsupported project
  path through this feature.
- URL payloads may contain source code and tests. Link creators and recipients
  should treat those URLs as shareable content; the app must not imply that
  links are private or tamper-resistant.
- The agent skill lives at
  `.agents/skills/playground-lesson/SKILL.md`. It authors a complete public
  lesson from the user's brief, checks the payload against this contract and
  the 32 KiB decoded limit, then returns a concise summary and share link. It
  includes a warning not to put secrets or private material in the payload;
  raw JSON is returned only when requested, and lesson sources are not written
  into the curriculum or generated content.