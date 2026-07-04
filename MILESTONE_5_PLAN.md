# Milestone 5 Implementation Plan

## Goal

Expand Rust Daily from a one-lesson prototype into an MVP content set.

Milestone 5 should add the first 30 lessons, review their hints and explanations, validate their metadata, and make the app able to present a deterministic daily lesson from that content set without adding a backend or a full authoring pipeline.

This milestone should make the product feel like a real daily practice app, while keeping the implementation aligned with the current frontend-only architecture.

## Scope

Milestone 5 should include:

- 30 total lessons in local content.
- Multiple short learning arcs.
- Concept metadata for all new lesson concepts.
- A minimal daily lesson selector.
- Hash access to every authored lesson for QA.
- Structural validation coverage where practical.
- `self-check` fallback only where structural validation is not yet fair.
- Content metadata validation.
- A repeatable content review checklist.
- Tablet viewport QA for every lesson.
- Production build and PWA smoke checks after content expansion.

Milestone 5 should not include:

- Browser Rust compiler integration.
- Full Cargo test execution in the browser.
- A hosted backend.
- Accounts.
- Cloud sync.
- Import/export.
- Notifications.
- Spaced repetition scheduling.
- Full concept graph UI.
- A separate lesson authoring pipeline.
- Solution reveal.
- User-selectable lesson catalog as the primary workflow.

## Product Behavior

The default user flow should remain:

1. User opens the app.
2. Daily Home shows exactly one lesson for the local day.
3. User opens that lesson.
4. User edits code.
5. User taps Check.
6. User completes the lesson or returns later from the local draft.

Milestone 5 should not turn the app into a lesson browser. Extra lesson access can exist through hash URLs for manual QA, but the product surface should still emphasize one daily lesson.

## Key Design Decision

Add a minimal daily selector in this milestone.

Reasoning:

- The current app uses `lessons[0]` as today's lesson.
- Adding 30 lessons without selection would hide most of the new content from the product.
- A full scheduler is too large for Milestone 5.
- A deterministic local selector is enough for MVP content QA.

Recommended rule:

```text
daily lesson = first incomplete lesson in lesson order
```

If all lessons are complete:

```text
daily lesson = lesson for local day index modulo lesson count
```

This keeps the app simple and lets arcs progress naturally. Full review scheduling can come later.

## Content Strategy

Author the first 30 lessons as five compact arcs.

Rules:

- Each lesson teaches exactly one concept.
- Each lesson should fit in 5-10 minutes.
- Each arc should produce a coherent micro-artifact.
- Starter code should stay small enough for tablet editing.
- Every lesson must have up to three hints.
- Every lesson must have a short completion explanation.
- Every lesson must have a clear validation mode.
- No lesson should require external crates.
- No lesson should require autocomplete.

## Proposed 30-Lesson Curriculum

### Arc 1: Parse A User From Text

Outcome:

```text
User parser with typed errors, Display/Error impls, conversion impls, and small tests.
```

Lessons:

1. `error-enum-parse-user-001`
   - Concept: error enum design.
   - Task: define `ParseUserError` variants.
   - Validation: structural.
   - Status: already exists.

2. `display-parse-user-error-002`
   - Concept: `Display`.
   - Task: implement `Display` for `ParseUserError`.
   - Validation: structural initially.

3. `error-trait-parse-user-error-003`
   - Concept: `std::error::Error`.
   - Task: implement `Error` for the enum.
   - Validation: structural.

4. `source-parse-int-error-004`
   - Concept: preserving source errors.
   - Task: change invalid ID handling to keep `ParseIntError`.
   - Validation: structural.

5. `from-parse-int-error-005`
   - Concept: `From`.
   - Task: implement `From<ParseIntError>` for `ParseUserError`.
   - Validation: structural.

6. `tryfrom-user-str-006`
   - Concept: `TryFrom<&str>`.
   - Task: implement `TryFrom<&str>` for `User`.
   - Validation: structural.

7. `parse-user-public-tests-007`
   - Concept: basic tests.
   - Task: write small tests for success and failure cases.
   - Validation: self-check until browser Rust validation exists.

### Arc 2: Configure A Small Service

Outcome:

```text
Config type with defaults, setters, optional values, and small validation errors.
```

Lessons:

8. `config-struct-fields-001`
   - Concept: struct field design.
   - Task: define a `Config` struct with owned fields.
   - Validation: structural.

9. `config-default-impl-002`
   - Concept: `Default`.
   - Task: implement `Default` for `Config`.
   - Validation: structural.

10. `config-methods-003`
    - Concept: methods.
    - Task: add small accessor or update methods.
    - Validation: structural.

11. `config-option-timeout-004`
    - Concept: `Option`.
    - Task: model an optional timeout.
    - Validation: structural.

12. `config-result-validate-005`
    - Concept: `Result`.
    - Task: return a typed validation error.
    - Validation: structural.

13. `config-borrowed-key-006`
    - Concept: borrowing in APIs.
    - Task: accept `&str` where ownership is unnecessary.
    - Validation: structural.

### Arc 3: Summarize Inventory

Outcome:

```text
Inventory helpers that use clear iterator and collection patterns.
```

Lessons:

14. `inventory-item-struct-001`
    - Concept: domain structs.
    - Task: define an `Item` struct.
    - Validation: structural.

15. `inventory-filter-map-002`
    - Concept: `filter_map`.
    - Task: collect available item names.
    - Validation: structural.

16. `inventory-fold-total-003`
    - Concept: `fold` or `sum`.
    - Task: compute total quantity.
    - Validation: structural.

17. `inventory-clear-loop-004`
    - Concept: iterator judgment.
    - Task: replace an unclear chain with a clear loop or vice versa.
    - Validation: self-check unless a narrow structural check is fair.

18. `inventory-intoiterator-005`
    - Concept: `IntoIterator`.
    - Task: make an inventory wrapper iterable.
    - Validation: structural.

19. `inventory-sort-by-key-006`
    - Concept: ordering with `sort_by_key`.
    - Task: sort items by name or quantity.
    - Validation: structural.

### Arc 4: Build A Request API

Outcome:

```text
Small request builder API with clear ownership and validation boundaries.
```

Lessons:

20. `request-struct-001`
    - Concept: API surface structs.
    - Task: define a `Request` type.
    - Validation: structural.

21. `request-builder-owned-setters-002`
    - Concept: builder setters taking `self`.
    - Task: add consuming builder methods.
    - Validation: structural.

22. `request-builder-default-003`
    - Concept: default state.
    - Task: implement `Default` for the builder.
    - Validation: structural.

23. `request-builder-result-004`
    - Concept: validating build output.
    - Task: make `build` return `Result`.
    - Validation: structural.

24. `request-builder-tryfrom-005`
    - Concept: `TryFrom`.
    - Task: convert a small input type into a request.
    - Validation: structural.

25. `request-doc-example-006`
    - Concept: documentation examples.
    - Task: write a short doc example for the API.
    - Validation: self-check until browser Rust validation exists.

### Arc 5: Inspect Log Lines

Outcome:

```text
Borrowed log-view helpers that practice lifetimes, pattern matching, and Cow.
```

Lessons:

26. `log-entry-borrowed-001`
    - Concept: borrowed fields.
    - Task: design a `LogEntry<'a>` with borrowed data.
    - Validation: structural.

27. `log-view-lifetime-002`
    - Concept: explicit lifetimes.
    - Task: add a lifetime-backed view type.
    - Validation: structural.

28. `log-level-match-003`
    - Concept: pattern matching.
    - Task: map log levels with `match`.
    - Validation: structural.

29. `log-message-cow-004`
    - Concept: `Cow<'a, str>`.
    - Task: allow borrowed or owned messages.
    - Validation: structural.

30. `log-filter-tests-005`
    - Concept: focused tests.
    - Task: write tests for log filtering behavior.
    - Validation: self-check until browser Rust validation exists.

## Validation Strategy

Do not add browser Rust compilation in this milestone.

Milestone 5 should extend the existing structural validator only as needed for fair content checks.

Recommended new structural check types:

```ts
type StructuralCheck =
  | {
      type: "enum_unit_variants";
      enumName: string;
      requiredVariants: string[];
    }
  | {
      type: "struct_fields";
      structName: string;
      requiredFields: Array<{
        name: string;
        typeIncludes: string[];
      }>;
    }
  | {
      type: "impl_trait_for_type";
      traitName: string;
      typeName: string;
    }
  | {
      type: "impl_method";
      implFor: string;
      methodName: string;
      requiredSignatureIncludes: string[];
    }
  | {
      type: "function_signature";
      functionName: string;
      requiredSignatureIncludes: string[];
    }
  | {
      type: "source_includes";
      requiredSnippets: string[];
      forbiddenSnippets?: string[];
    };
```

Keep these checks conservative:

- Strip comments before checking snippets.
- Prefer declaration and signature checks over broad source search.
- Do not claim compilation has happened.
- Return clear failure messages.
- Use `self-check` when structural validation would be misleading.

The `source_includes` check should be a last resort for small idiom markers such as `sort_by_key`, `filter_map`, or `Cow`.

## Content Data Rules

Every lesson must include:

- `id`.
- `arcId`.
- `arcTitle`.
- `day`.
- `arcLength`.
- `title`.
- `conceptId`.
- `difficulty`.
- `estimatedMinutes`.
- `scenario`.
- `instructions`.
- `starterCode`.
- `hints`.
- `completionExplanation`.
- `validation`.

Every concept must include:

- `id`.
- `name`.
- `description`.
- `prerequisites`.
- `difficulty`.
- `lessonIds`.
- `tags`.
- `masteryThreshold`.

Content consistency rules:

- Lesson IDs are unique.
- Concept IDs are unique.
- Every lesson `conceptId` exists.
- Every concept `lessonIds` entry exists.
- Every lesson appears in exactly one concept `lessonIds` list.
- Each arc has contiguous `day` values from `1` to `arcLength`.
- Each lesson has 1-3 hints.
- `estimatedMinutes` is between 5 and 10.
- `difficulty` is `easy`, `medium`, or `advanced`.
- No lesson title, hint, or explanation promises real compilation unless `browser-rust` is implemented.

## Minimal Daily Selector

Create a small progression helper.

Recommended file:

```text
src/progression/selectDailyLesson.ts
```

Inputs:

- `lessons`.
- local progress.
- current local date.

Rules:

1. If there is an incomplete lesson, return the first incomplete lesson in content order.
2. If all lessons are complete, return `lessons[dayIndex % lessons.length]`.
3. Hash routing can still open any valid lesson ID.
4. Invalid hashes should fall back to the selected daily lesson or home state.

This is not spaced repetition. It is only enough to make the first 30 lessons usable.

## Content QA Tooling

Add a lightweight content validation script.

Recommended file:

```text
scripts/validate-content.mjs
```

Recommended package script:

```json
{
  "scripts": {
    "content:check": "node scripts/validate-content.mjs"
  }
}
```

The script should:

- Parse `src/content/lessons.json`.
- Parse `src/content/concepts.json`.
- Enforce the content consistency rules.
- Validate known structural check shapes.
- Fail with actionable messages.

This is not a full authoring pipeline. It is a safety check for JSON content.

## Proposed File Changes

```text
package.json                    # Add content:check script.
scripts/
  validate-content.mjs          # Validate lesson/concept metadata.
src/
  App.tsx                       # Use selected daily lesson instead of lessons[0].
  content/
    concepts.json               # Add concept nodes and lesson links.
    lessons.json                # Add the 30-lesson MVP content set.
  progression/
    selectDailyLesson.ts        # Minimal daily lesson selection.
  types/
    validation.ts               # Add structural check variants.
  validation/
    structuralChecks.ts         # Implement new structural checks.
    validationWorker.ts         # Dispatch new structural checks.
```

Optional:

```text
docs/
  content-review.md             # Human review notes for all 30 lessons.
```

## Implementation Steps

1. Add content validation tooling.
   - Create `scripts/validate-content.mjs`.
   - Add `npm run content:check`.
   - Validate existing one-lesson content first.

2. Add progression helper.
   - Create `selectDailyLesson`.
   - Select first incomplete lesson.
   - Fall back deterministically when all lessons are complete.
   - Update `App.tsx` to use the selected lesson on Daily Home.

3. Extend structural validation types.
   - Add the new check types needed by the lesson plan.
   - Keep the existing `enum_unit_variants` behavior unchanged.
   - Return `unsupported` or a clear failure for unknown check types.

4. Implement structural checks incrementally.
   - Start with `struct_fields`.
   - Add `impl_trait_for_type`.
   - Add `impl_method`.
   - Add `function_signature`.
   - Add constrained `source_includes`.
   - Keep comment stripping centralized.

5. Expand concept metadata.
   - Add concept nodes for the 30-lesson curriculum.
   - Keep prerequisites conservative.
   - Make `lessonIds` match the final lesson IDs exactly.

6. Author lessons arc by arc.
   - Finish all seven `parse-user` lessons first.
   - Then add `config`, `inventory`, `request-builder`, and `log-view` arcs.
   - Keep each lesson self-contained enough to open directly by hash.

7. Add validation metadata to each lesson.
   - Prefer structural validation.
   - Use `self-check` only for lessons that ask the learner to write tests or make judgment-heavy refactors.
   - Ensure validation copy says `Check`, not `Run Tests`, unless browser Rust validation exists.

8. Review lesson copy.
   - Confirm one concept per lesson.
   - Tighten scenarios and instructions.
   - Keep hints progressive.
   - Keep completion explanations under one minute.

9. Run content and build checks.
   - `npm run content:check`.
   - `npm run build`.
   - Required Fallow checks.

10. Run manual lesson QA.
    - Open each lesson by hash.
    - Confirm starter code appears.
    - Confirm hints reveal one at a time.
    - Confirm draft persistence works.
    - Confirm Check behavior matches the validation mode.
    - Confirm tablet viewport remains usable.

## Acceptance Criteria

Milestone 5 is complete when:

- `src/content/lessons.json` contains exactly 30 lessons.
- `src/content/concepts.json` contains all referenced concepts.
- Every lesson has complete metadata.
- Every lesson belongs to a short learning arc.
- Every lesson teaches one concept.
- Every lesson has 1-3 hints.
- Every lesson has a completion explanation.
- Every lesson has a validation mode.
- Structural validation exists for lessons where it can be fair.
- `self-check` lessons are clearly marked and do not pretend to be compiled.
- Daily Home selects the first incomplete lesson instead of always selecting `lessons[0]`.
- Hash routing can open every lesson for QA.
- `npm run content:check` passes.
- `npm run build` passes.
- Required Fallow checks pass.
- Production preview still registers the service worker.
- A tablet viewport smoke test passes for every lesson.

## Suggested Manual QA

Run through this checklist after implementation:

- Reset local progress.
- Open Daily Home.
- Confirm the first lesson appears.
- Complete the first lesson.
- Return to Daily Home.
- Confirm the second lesson appears.
- Open each lesson by hash.
- Confirm arc title, day number, and task copy are correct.
- Confirm every Check button either validates structurally or clearly reports self-check behavior.
- Confirm no lesson uses language implying AI grading or remote compilation.
- Reveal all hints for each lesson and confirm none gives away full code too early.
- Complete at least one lesson from each arc.
- Refresh after completion and confirm selected daily lesson remains correct.
- Build with `VITE_BASE_PATH=/rust-daily/`.
- Preview the build and confirm app shell, current lesson, and validation worker still work offline.

## Content Review Checklist

Review every lesson against these questions:

- Is there exactly one Rust concept?
- Can the task be completed in 5-10 minutes?
- Is the code realistic enough to feel like production Rust?
- Is the editable area small enough for a tablet?
- Does the lesson avoid autocomplete dependence?
- Are the hints ordered from nudge to concept explanation?
- Does the completion explanation explain why the result is idiomatic?
- Is the validation fair for the current frontend-only checker?
- Does the lesson avoid external crates?
- Does the lesson fit its arc outcome?

## Risks

### Structural Validation Overreach

Risk:

- Structural checks may accept code that looks right but would not compile.

Mitigation:

- Keep validation copy honest.
- Avoid saying `compiled` or `tests passed`.
- Use structural checks only for narrow declaration and API-shape tasks.
- Defer true compiler-backed validation to a later browser Rust milestone.

### Content Bulk Without Quality

Risk:

- Adding 29 new lessons quickly could dilute the one-concept rule.

Mitigation:

- Author one arc at a time.
- Review every lesson with the checklist.
- Prefer fewer polished lessons over rushed filler if scope pressure appears.

### Daily Selector Becomes A Scheduler

Risk:

- Selection logic may grow into spaced repetition prematurely.

Mitigation:

- Select first incomplete lesson only.
- Do not add review due logic in this milestone.
- Keep full scheduler work for a later progression milestone.

### Bundle Growth

Risk:

- More embedded lesson content increases the main JS bundle.

Mitigation:

- Measure production bundle after content expansion.
- Keep starter code short.
- Defer external content bundles until the current approach becomes a real problem.

## Handoff To Portability Hardening

Milestone 5 should leave these seams ready for MVP portability work:

- Progress now matters across many lessons.
- Lesson IDs are stable.
- Concept IDs are stable.
- Local progress has enough data to export and import.
- Content checks protect future lesson additions.

The next milestone can then add progress export/import without also trying to author the whole initial curriculum.
