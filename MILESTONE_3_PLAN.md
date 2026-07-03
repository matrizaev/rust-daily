# Milestone 3 Implementation Plan

## Goal

Add local progress tracking.

Milestone 3 should record that a lesson was attempted and completed after a passing validation result. The app should then show a basic streak, completed lesson count, and concept progress using only browser-local storage.

This milestone turns validation success into durable user progress. It does not need a sophisticated scheduler, full concept graph, review queue, account system, or cloud sync.

## Scope

Milestone 3 should include:

- Local attempt records.
- Local completion records.
- Basic streak calculation.
- Basic concept progress.
- Daily Home progress summary.
- Lesson completion state after a passed check.
- A short completion explanation surface.
- Progress persistence across refresh.
- Reset-local-progress control for development/manual QA.

Milestone 3 should not include:

- Accounts.
- Cloud sync.
- Import/export.
- Service worker caching.
- Notifications.
- Spaced repetition.
- Full concept graph UI.
- Multiple daily lessons.
- Unlocking many lessons.
- Browser Rust compiler work.

## Product Behavior

The user flow should be:

1. User opens today's lesson.
2. User edits code.
3. User taps Check.
4. Validation passes.
5. App records lesson completion locally.
6. App shows a completion explanation.
7. Daily Home shows updated streak and completed count.

Repeated successful checks for the same lesson on the same local date should not create duplicate completions or increment streak multiple times.

## Storage Strategy

Use LocalStorage for Milestone 3.

Reasoning:

- Current drafts already use LocalStorage.
- The data volume is tiny.
- IndexedDB can wait until lesson bundles and offline assets make it necessary.

Use a versioned key:

```text
rust-daily:v1:progress
```

## Data Model

Create `src/types/progress.ts`.

```ts
type AttemptStatus = "in_progress" | "completed";

type LessonAttempt = {
  id: string;
  lessonId: string;
  startedAt: string;
  completedAt: string | null;
  status: AttemptStatus;
  validationAttempts: number;
  hintsRevealed: number;
  durationSeconds: number;
};

type LessonCompletion = {
  lessonId: string;
  conceptId: string;
  completedAt: string;
  localDate: string;
  timezoneOffsetMinutes: number;
};

type ConceptState =
  | "locked"
  | "introduced"
  | "practicing"
  | "comfortable"
  | "review_due"
  | "mastered";

type ConceptProgress = {
  conceptId: string;
  state: ConceptState;
  completedLessons: number;
  successfulReviews: number;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
};

type ProgressStore = {
  version: 1;
  createdAt: string;
  updatedAt: string;
  attempts: LessonAttempt[];
  completions: LessonCompletion[];
  concepts: Record<string, ConceptProgress>;
};
```

Do not store source code in progress records. Draft source remains in `draftStore`.

## Local Date Rules

Create a helper that derives the user's local date from `new Date()`.

Format:

```text
YYYY-MM-DD
```

Store:

- `completedAt`: ISO timestamp.
- `localDate`: local date at completion time.
- `timezoneOffsetMinutes`: `new Date().getTimezoneOffset()`.

The initial streak logic should be simple and deterministic:

- Count consecutive local dates ending with today if today has a completion.
- If today has no completion, count consecutive dates ending with yesterday.
- Multiple completions on the same date count once.
- No streak freeze yet.

## Attempt Rules

Create or update an attempt when:

- The lesson screen opens.
- The user runs Check.
- The user reveals a hint.
- The user completes the lesson.

For Milestone 3, a single current attempt per lesson is enough.

Behavior:

- Opening a lesson creates an `in_progress` attempt if none exists.
- Each Check increments `validationAttempts`.
- Revealing a hint updates `hintsRevealed` to the max revealed count.
- Passing validation marks the attempt `completed`.
- `durationSeconds` is based on `startedAt` to completion time.

Do not create duplicate completed attempts for repeated passing checks.

## Completion Rules

Record a completion when:

- Validation result status is `passed`.
- Lesson has not already been completed.

Completion update should:

- Add `LessonCompletion`.
- Mark attempt completed.
- Update concept progress.
- Update `updatedAt`.

If the same lesson is checked again after completion:

- Keep the existing completion.
- Do not increment streak again.
- Optionally update the latest validation result in UI only.

## Concept Progress Rules

For Milestone 3, keep concept progress simple.

When a lesson is completed:

- Create concept progress if missing.
- Increment completed lesson count only once per lesson.
- Set `lastPracticedAt` to completion time.
- Set state:
  - `introduced` after first completion.
  - `practicing` after 2 completions.
  - `comfortable` when `completedLessons >= masteryThreshold`.
- Set `nextReviewAt` to null for now.

Do not implement review scheduling or mastery decay yet.

## Proposed File Changes

```text
src/
  components/
    CompletionPanel.tsx      # New completion explanation and status.
    DailyHome.tsx            # Show streak/completed summary.
    LessonScreen.tsx         # Record attempts and completions.
  progress/
    date.ts                  # Local date and streak helpers.
    progressStore.ts         # LocalStorage progress persistence.
    progressSelectors.ts     # Derived counts and summaries.
  types/
    progress.ts              # Progress data types.
    lesson.ts                # Add completion explanation field if needed.
  content/
    lessons.json             # Add completion explanation to first lesson.
```

Optional but useful:

```text
src/components/ProgressSummary.tsx
```

## Lesson Content Addition

Add an authored completion explanation to the first lesson.

Extend `Lesson`:

```ts
type Lesson = {
  // existing fields...
  completionExplanation: string;
};
```

Initial copy:

```text
Each parser failure now has a named enum variant. That gives callers a typed result they can match on instead of parsing strings or comparing error messages.
```

Keep explanations short enough to read in under one minute.

## UI Plan

### Daily Home

Add a compact progress strip:

- Current streak.
- Completed lessons.
- Concepts introduced.

Keep it secondary to today's lesson.

Example:

```text
3 day streak, 5 lessons completed, 4 concepts introduced
```

### Lesson Screen

After validation passes:

- Keep the validation result visible.
- Show a completion panel below the validation panel.
- Show the lesson explanation.
- Show a return-to-today button or simple status text.

Completion panel states:

- Not completed: hidden.
- Completed now: `Lesson complete`.
- Already completed: `Completed`.

Do not block editing after completion. The user may continue experimenting, but progress should not duplicate.

### Reset Local Progress

Add a small development-friendly reset control.

Recommended placement:

- Daily Home footer.
- Text button: `Reset local progress`.

Behavior:

- Clear `rust-daily:v1:progress`.
- Do not clear code drafts.

This is useful while the app is pre-release. It can move to Settings later.

## Implementation Steps

1. Add progress types.
   - Create `src/types/progress.ts`.
   - Keep names aligned with `SPEC.md` data model.

2. Add date helpers.
   - Implement local `YYYY-MM-DD` formatting.
   - Implement consecutive-day streak calculation.
   - Keep helpers pure.

3. Add progress store.
   - Implement load, save, initialize, and reset.
   - Handle malformed LocalStorage safely.
   - Use `rust-daily:v1:progress`.

4. Add progress selectors.
   - Completed lesson count.
   - Concepts introduced count.
   - Current streak.
   - Is lesson completed.

5. Wire attempts.
   - Create/update attempt when lesson opens.
   - Increment validation attempts on Check.
   - Update hints revealed.

6. Wire completion.
   - When validation passes, record completion.
   - Update concept progress.
   - Prevent duplicate completion records.

7. Add completion explanation.
   - Extend lesson content and type.
   - Add `CompletionPanel`.
   - Render after passed validation or existing completion.

8. Update Daily Home.
   - Load progress.
   - Show compact summary.
   - Add reset-local-progress control.

9. Polish persistence.
   - Refresh after completion and confirm state remains.
   - Reset progress and confirm summary returns to zero.

## Acceptance Criteria

Milestone 3 is complete when:

- Opening a lesson creates or preserves a local attempt.
- Running Check increments validation attempt count.
- Revealing hints records the max hints revealed for the current attempt.
- Passing validation records one lesson completion.
- Re-checking a completed lesson does not duplicate completion.
- Daily Home shows current streak, completed lesson count, and introduced concept count.
- Completion persists after refresh.
- Concept progress updates after completion.
- Completion explanation appears after pass.
- Reset local progress clears progress but does not clear drafts.
- `npm run build` passes.
- Required Fallow checks pass.

## Suggested Manual QA

Run through this checklist:

- Reset local progress.
- Open Daily Home and confirm progress summary is zero.
- Open the first lesson.
- Click Check on starter code and confirm it fails.
- Reveal one hint.
- Add all required enum variants.
- Click Check and confirm it passes.
- Confirm completion explanation appears.
- Return to Daily Home.
- Confirm completed lessons is `1`.
- Confirm concepts introduced is `1`.
- Confirm streak is `1` for today's local date.
- Refresh and confirm progress remains.
- Reopen lesson and click Check again.
- Confirm completion count remains `1`.
- Reset local progress and confirm draft code remains unchanged.

## Validation Copy Guidelines

Use plain product language:

- `Lesson complete.`
- `Completed earlier today.`
- `1 day streak.`
- `1 lesson completed.`
- `1 concept introduced.`

Avoid implying cloud sync:

- Do not say `saved to your account`.
- Do not say `synced`.
- Do not say `uploaded`.

## Handoff to Milestone 4

Milestone 3 should leave these seams ready for PWA/offline readiness:

- Local progress is fully independent from network.
- Drafts and progress use versioned storage keys.
- Daily lesson can be rendered from local content plus local progress.
- Completion behavior does not require a backend.

Milestone 4 can then add app shell caching, install metadata, and validation asset caching.
