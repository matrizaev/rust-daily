# Milestone 2 Implementation Plan

## Goal

Add the first frontend-only validation prototype.

Milestone 2 should replace the disabled Check button with a working browser-side validation flow for the first lesson. The validation must run in a Web Worker, return structured results, and show clear feedback in the lesson UI.

This milestone proves the validation architecture, not full Rust compilation.

## Scope

Milestone 2 should include:

- A validation metadata schema in lesson content.
- A typed validation request/result model.
- A Web Worker validation runtime.
- One implemented validation mode: `structural`.
- One working validation bundle for `error-enum-parse-user-001`.
- A Check button that runs validation on the current editor contents.
- A result panel for passed, failed, timeout, unsupported, and internal error states.
- Basic timeout and output-size protection.

Milestone 2 should not include:

- Full `cargo test`.
- A hosted backend.
- External dependency resolution.
- Browser Rust compiler integration unless it is trivial.
- Service worker caching.
- Streaks or concept progress.
- Account sync.
- Hidden or secret tests.
- Automatic validation on every keystroke.

## Validation Strategy

Use `structural` validation for the first working prototype.

Reasoning:

- It is enough to validate the first lesson, which asks the user to add enum variants.
- It keeps Milestone 2 small and frontend-only.
- It exercises the same request/result/worker/UI architecture that a future `browser-rust` engine can use.
- It avoids a premature dependency on a browser Rust compiler before the app has a stable validation surface.

The UI should call this action `Check`, not `Run Tests`, because Milestone 2 is not yet running real Rust tests.

## First Validated Lesson

Lesson: `error-enum-parse-user-001`.

Expected user change:

```rust
pub enum ParseUserError {
    MissingId,
    MissingName,
    MissingEmail,
    InvalidId,
}
```

Validation should pass when:

- `ParseUserError` exists.
- The enum body includes unit-like variants:
  - `MissingId`.
  - `MissingName`.
  - `MissingEmail`.
  - `InvalidId`.
- The variants are not only present inside comments.
- The original TODO comment is removed or no longer the only body content.

Validation should fail when:

- The enum is missing.
- One or more required variants are missing.
- The variants are misspelled.
- The enum body is still effectively empty.

Validation does not need to prove the code compiles in this milestone.

## Proposed File Changes

```text
src/
  components/
    LessonActions.tsx        # Enable Check button and show running state.
    LessonScreen.tsx         # Own validation state and pass code to validator.
    ValidationPanel.tsx      # New feedback surface.
  content/
    lessons.json             # Add validation metadata to first lesson.
  types/
    lesson.ts                # Add validation metadata types.
    validation.ts            # New request/result/check types.
  validation/
    structuralChecks.ts      # Pure structural check helpers.
    validationClient.ts      # Main-thread worker wrapper and timeout.
    validationWorker.ts      # Worker entrypoint.
```

Optional later, not required for Milestone 2:

```text
src/validation/browserRustWorker.ts
src/validation/selfCheck.ts
```

## Lesson Validation Schema

Extend `Lesson` with optional validation metadata:

```ts
type LessonValidation =
  | {
      mode: "structural";
      timeoutMs: number;
      checks: StructuralCheck[];
    }
  | {
      mode: "browser-rust";
      timeoutMs: number;
      checks: unknown[];
    }
  | {
      mode: "self-check";
      timeoutMs?: never;
      checks?: never;
    };
```

Initial structural check:

```ts
type StructuralCheck =
  | {
      type: "enum_unit_variants";
      enumName: string;
      requiredVariants: string[];
    };
```

Initial lesson JSON:

```json
{
  "validation": {
    "mode": "structural",
    "timeoutMs": 10000,
    "checks": [
      {
        "type": "enum_unit_variants",
        "enumName": "ParseUserError",
        "requiredVariants": [
          "MissingId",
          "MissingName",
          "MissingEmail",
          "InvalidId"
        ]
      }
    ]
  }
}
```

Keep the schema intentionally small. Add more check types only when a new lesson requires them.

## Validation Types

Create shared request/result types:

```ts
type ValidationStatus =
  | "passed"
  | "failed"
  | "timeout"
  | "unsupported"
  | "internal_error";

type ValidationRequest = {
  lessonId: string;
  validation: LessonValidation;
  files: {
    "src/lib.rs": string;
  };
};

type ValidationFailure = {
  name: string;
  message: string;
};

type ValidationResult = {
  status: ValidationStatus;
  durationMs: number;
  summary: string;
  diagnostics: string;
  failures: ValidationFailure[];
};
```

The worker should never return raw exceptions to the UI. Convert unexpected errors into `internal_error`.

## Structural Check Rules

Implement `enum_unit_variants` with a deliberately narrow parser:

1. Strip Rust line comments and block comments.
2. Find `enum <enumName> { ... }`.
3. Extract the body using brace matching.
4. Split top-level comma-separated entries.
5. Normalize each variant name.
6. Compare against `requiredVariants`.

Do not use broad string checks like `source.includes("MissingId")` against unstripped source; that would pass commented-out code.

For Milestone 2, keep the parser conservative:

- Unit variants are supported.
- Tuple variants are not required.
- Struct variants are not required.
- Nested macros are not required.
- Invalid Rust syntax may produce structural failures rather than compiler errors.

## Web Worker Flow

Main thread:

1. User taps Check.
2. `LessonScreen` creates a `ValidationRequest`.
3. `validationClient` starts `validationWorker`.
4. Main thread starts a timeout timer.
5. Worker returns `ValidationResult`.
6. Main thread terminates the worker.
7. UI renders result.

Worker:

1. Receive `ValidationRequest`.
2. Select validation mode.
3. Run `structural` checks.
4. Return `ValidationResult`.

Timeout behavior:

- Default to lesson `timeoutMs`.
- Terminate the worker on timeout.
- Return `status: "timeout"`.

Source-size behavior:

- Reject source larger than 256 KB.
- Return `status: "failed"` with a clear message.

## UI Plan

### LessonActions

Replace the disabled validation placeholder with an enabled Check button when the lesson has validation metadata.

States:

- Idle: `Check`.
- Running: `Checking...`, disabled.
- Unsupported: disabled or shows unsupported message.

Reset and Hint should remain usable except while reset would conflict with an active validation. It is acceptable to disable Check only while running.

### ValidationPanel

Add a panel below the editor footer or between the footer and hints.

States:

- Empty: short note, `Run Check when you are ready.`
- Running: `Checking your code...`
- Passed: concise success message.
- Failed: summary plus failure list.
- Timeout: explain that validation took too long.
- Unsupported: explain that this lesson cannot be checked yet.
- Internal error: explain that the app failed to run validation.

Do not show scary compiler-like language for structural failures. Be direct:

- `Missing variant: MissingEmail.`
- `ParseUserError enum was not found.`

### Stale Results

When the editor changes after a validation result:

- Keep the previous result visible.
- Mark it as stale with text like `Code changed since this check.`

Do not automatically rerun validation.

## Implementation Steps

1. Add validation types.
   - Create `src/types/validation.ts`.
   - Extend `Lesson` in `src/types/lesson.ts`.
   - Update `lessons.json` with structural validation metadata.

2. Build pure structural checks.
   - Implement comment stripping.
   - Implement enum body extraction.
   - Implement required variant comparison.
   - Keep functions pure and easy to test later.

3. Add worker runtime.
   - Create `validationWorker.ts`.
   - Support `structural`.
   - Return `unsupported` for other modes.
   - Catch unexpected errors.

4. Add main-thread validation client.
   - Create worker with Vite's `new Worker(new URL(..., import.meta.url), { type: "module" })`.
   - Send request.
   - Enforce timeout.
   - Terminate worker after result or timeout.

5. Wire UI state.
   - Add validation state to `LessonScreen`.
   - Pass `onCheck` and `isChecking` to `LessonActions`.
   - Clear or mark stale result when code changes.

6. Add result panel.
   - Create `ValidationPanel.tsx`.
   - Render all result states.
   - Keep copy concise and tablet-readable.

7. Polish interactions.
   - Check button is at least 44px high.
   - Panel text wraps cleanly on narrow widths.
   - Hints remain available.
   - Draft persistence remains unchanged.

## Acceptance Criteria

Milestone 2 is complete when:

- The Check button is enabled for the first lesson.
- Clicking Check runs validation in a Web Worker.
- Starter code fails with a clear message about missing enum variants.
- Adding all required variants makes validation pass.
- Removing or misspelling one variant makes validation fail.
- Commented-out variants do not pass validation.
- Validation result is shown in the UI.
- Validation state does not block editing after it completes.
- Editing after a check marks the previous result as stale.
- Worker timeout is handled and shown as a timeout result.
- `npm run build` passes.
- Required Fallow checks pass.

## Suggested Manual QA

Run through this checklist:

- Open the app with `npm run dev`.
- Open the first lesson.
- Click Check on starter code and confirm it fails.
- Add `MissingId`, `MissingName`, `MissingEmail`, and `InvalidId`.
- Click Check and confirm it passes.
- Remove `MissingEmail`, click Check, and confirm it fails.
- Put `MissingEmail` only inside a comment and confirm it still fails.
- Edit the code after a passed result and confirm the result is marked stale.
- Refresh the page and confirm draft persistence still works.
- Reset and confirm starter code is restored.
- Confirm hints still reveal one at a time.
- Confirm no autocomplete popup appears while typing.

## Validation Copy Guidelines

Use plain language:

- `All checks passed.`
- `Missing variant: MissingEmail.`
- `ParseUserError enum was not found.`
- `This check took too long and was stopped.`

Avoid misleading language:

- Do not say `cargo test passed`.
- Do not say `compiled successfully`.
- Do not say `hidden tests passed`.

## Handoff to Milestone 3

Milestone 2 should leave these seams ready for progress tracking:

- A stable `ValidationResult`.
- A `passed` state that Milestone 3 can use to mark an attempt complete.
- A single place in `LessonScreen` where completion can be triggered.
- Validation metadata in lesson content.

Milestone 3 can then record attempts, completion, streak, and concept progress locally when validation passes.
