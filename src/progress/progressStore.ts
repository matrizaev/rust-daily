import type { Concept, Lesson } from "../types/lesson";
import type {
  AttemptStatus,
  ConceptProgress,
  ConceptState,
  LessonAttempt,
  LessonCompletion,
  ProgressStore,
} from "../types/progress";
import { toLocalDate } from "./date";

const PROGRESS_KEY = "rust-daily:v1:progress";

const nowIso = (now = new Date()) => now.toISOString();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string =>
  typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNullableString = (value: unknown): value is string | null =>
  value === null || isString(value);

const isArrayOf = <T>(
  value: unknown,
  guard: (item: unknown) => item is T,
): value is T[] => Array.isArray(value) && value.every(guard);

const hasStringFields = (
  value: Record<string, unknown>,
  fields: string[],
) => fields.every((field) => isString(value[field]));

const hasNumberFields = (
  value: Record<string, unknown>,
  fields: string[],
) => fields.every((field) => isNumber(value[field]));

const createProgressStore = (now = new Date()): ProgressStore => {
  const timestamp = nowIso(now);

  return {
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    attempts: [],
    completions: [],
    concepts: {},
  };
};

const hasProgressVersion = (value: Record<string, unknown>) =>
  value.version === 1;

const hasProgressTimestamps = (value: Record<string, unknown>) =>
  hasStringFields(value, ["createdAt", "updatedAt"]);

const ATTEMPT_STATUSES = new Set<string>(["in_progress", "completed"]);
const CONCEPT_STATES = new Set<string>([
  "locked",
  "introduced",
  "practicing",
  "comfortable",
  "review_due",
  "mastered",
]);

const isAttemptStatus = (value: unknown): value is AttemptStatus =>
  isString(value) && ATTEMPT_STATUSES.has(value);

const attemptValidators = [
  (value: Record<string, unknown>) =>
    hasStringFields(value, ["id", "lessonId", "startedAt"]),
  (value: Record<string, unknown>) =>
    hasNumberFields(value, [
      "validationAttempts",
      "hintsRevealed",
      "durationSeconds",
    ]),
  (value: Record<string, unknown>) => isNullableString(value.completedAt),
  (value: Record<string, unknown>) => isAttemptStatus(value.status),
];

const hasAttemptFields = (value: Record<string, unknown>) =>
  attemptValidators.every((validator) => validator(value));

const isLessonAttempt = (value: unknown): value is LessonAttempt =>
  isRecord(value) && hasAttemptFields(value);

const isLessonCompletion = (value: unknown): value is LessonCompletion =>
  isRecord(value) &&
  hasStringFields(value, [
    "lessonId",
    "conceptId",
    "completedAt",
    "localDate",
  ]) &&
  isNumber(value.timezoneOffsetMinutes);

const isConceptState = (value: unknown): value is ConceptState =>
  isString(value) && CONCEPT_STATES.has(value);

const conceptProgressValidators = [
  (value: Record<string, unknown>) => hasStringFields(value, ["conceptId"]),
  (value: Record<string, unknown>) =>
    hasNumberFields(value, ["completedLessons", "successfulReviews"]),
  (value: Record<string, unknown>) => isConceptState(value.state),
  (value: Record<string, unknown>) => isNullableString(value.lastPracticedAt),
  (value: Record<string, unknown>) => isNullableString(value.nextReviewAt),
];

const hasConceptProgressFields = (value: Record<string, unknown>) =>
  conceptProgressValidators.every((validator) => validator(value));

const isConceptProgress = (value: unknown): value is ConceptProgress =>
  isRecord(value) && hasConceptProgressFields(value);

const hasValidConceptValues = (value: Record<string, unknown>) =>
  Object.values(value).every(isConceptProgress);

const hasProgressCollections = (value: Record<string, unknown>) =>
  isArrayOf(value.attempts, isLessonAttempt) &&
  isArrayOf(value.completions, isLessonCompletion);

const hasConceptMap = (value: Record<string, unknown>) =>
  isRecord(value.concepts) && hasValidConceptValues(value.concepts);

const progressStoreValidators = [
  hasProgressVersion,
  hasProgressTimestamps,
  hasProgressCollections,
  hasConceptMap,
];

const hasProgressStoreFields = (value: Record<string, unknown>) =>
  progressStoreValidators.every((validator) => validator(value));

const isProgressStore = (value: unknown): value is ProgressStore =>
  isRecord(value) && hasProgressStoreFields(value);

export const loadProgress = () => {
  try {
    const raw = window.localStorage.getItem(PROGRESS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;

    return isProgressStore(parsed) ? parsed : createProgressStore();
  } catch {
    return createProgressStore();
  }
};

const saveProgress = (progress: ProgressStore) => {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // LocalStorage can be unavailable or full in restricted browser modes.
  }
};

export const resetProgress = () => {
  try {
    window.localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // LocalStorage can be unavailable in restricted browser modes.
  }
};

const updateProgress = (update: (progress: ProgressStore) => ProgressStore) => {
  const next = update(loadProgress());
  saveProgress(next);

  return next;
};

const touch = (progress: ProgressStore, now: Date): ProgressStore => ({
  ...progress,
  updatedAt: nowIso(now),
});

const attemptId = (lessonId: string, now: Date) =>
  `${lessonId}:${nowIso(now)}`;

const createAttempt = (lessonId: string, now: Date) => ({
  id: attemptId(lessonId, now),
  lessonId,
  startedAt: nowIso(now),
  completedAt: null,
  status: "in_progress" as const,
  validationAttempts: 0,
  hintsRevealed: 0,
  durationSeconds: 0,
});

const getAttemptIndex = (progress: ProgressStore, lessonId: string) =>
  progress.attempts.findIndex((attempt) => attempt.lessonId === lessonId);

const ensureAttempt = (
  progress: ProgressStore,
  lessonId: string,
  now: Date,
) => {
  if (getAttemptIndex(progress, lessonId) >= 0) {
    return progress;
  }

  return {
    ...progress,
    attempts: [...progress.attempts, createAttempt(lessonId, now)],
  };
};

const updateAttempt = (
  progress: ProgressStore,
  lessonId: string,
  update: (
    attempt: ProgressStore["attempts"][number],
  ) => ProgressStore["attempts"][number],
) => {
  const index = getAttemptIndex(progress, lessonId);

  return {
    ...progress,
    attempts: progress.attempts.map((attempt, attemptIndex) =>
      attemptIndex === index ? update(attempt) : attempt,
    ),
  };
};

const durationSeconds = (startedAt: string, completedAt: string) => {
  const durationMs = Date.parse(completedAt) - Date.parse(startedAt);

  return Math.max(0, Math.round(durationMs / 1000));
};

const hasCompletion = (progress: ProgressStore, lessonId: string) =>
  progress.completions.some((completion) => completion.lessonId === lessonId);

const initialConceptProgress = (conceptId: string): ConceptProgress => ({
  conceptId,
  state: "introduced",
  completedLessons: 0,
  successfulReviews: 0,
  lastPracticedAt: null,
  nextReviewAt: null,
});

const conceptState = (
  completedLessons: number,
  masteryThreshold: number,
): ConceptState => {
  if (completedLessons >= masteryThreshold) {
    return "comfortable";
  }

  return completedLessons >= 2 ? "practicing" : "introduced";
};

const updateConceptProgress = (
  progress: ProgressStore,
  concept: Concept,
  completedAt: string,
) => {
  const current =
    progress.concepts[concept.id] ?? initialConceptProgress(concept.id);
  const completedLessons = current.completedLessons + 1;

  return {
    ...progress.concepts,
    [concept.id]: {
      ...current,
      completedLessons,
      lastPracticedAt: completedAt,
      state: conceptState(completedLessons, concept.masteryThreshold),
      nextReviewAt: null,
    },
  };
};

const completeAttempt = (
  progress: ProgressStore,
  lessonId: string,
  completedAt: string,
) =>
  updateAttempt(progress, lessonId, (attempt) => ({
    ...attempt,
    completedAt: attempt.completedAt ?? completedAt,
    durationSeconds: durationSeconds(attempt.startedAt, completedAt),
    status: "completed",
  }));

export const ensureLessonAttempt = (lessonId: string, now = new Date()) =>
  updateProgress((progress) =>
    touch(ensureAttempt(progress, lessonId, now), now),
  );

export const recordValidationAttempt = (lessonId: string, now = new Date()) =>
  updateProgress((progress) =>
    touch(
      updateAttempt(
        ensureAttempt(progress, lessonId, now),
        lessonId,
        (attempt) => ({
          ...attempt,
          validationAttempts: attempt.validationAttempts + 1,
        }),
      ),
      now,
    ),
  );

export const recordHintReveal = (
  lessonId: string,
  hintsRevealed: number,
  now = new Date(),
) =>
  updateProgress((progress) =>
    touch(
      updateAttempt(
        ensureAttempt(progress, lessonId, now),
        lessonId,
        (attempt) => ({
          ...attempt,
          hintsRevealed: Math.max(attempt.hintsRevealed, hintsRevealed),
        }),
      ),
      now,
    ),
  );

export const recordLessonCompletion = (
  lesson: Lesson,
  concept: Concept | null,
  now = new Date(),
) => {
  let completedNow = false;
  const progress = updateProgress((current) => {
    const withAttempt = ensureAttempt(current, lesson.id, now);

    if (hasCompletion(withAttempt, lesson.id) || !concept) {
      return touch(withAttempt, now);
    }

    completedNow = true;
    const completedAt = nowIso(now);
    const completed = completeAttempt(withAttempt, lesson.id, completedAt);

    return touch(
      {
        ...completed,
        completions: [
          ...completed.completions,
          {
            lessonId: lesson.id,
            conceptId: lesson.conceptId,
            completedAt,
            localDate: toLocalDate(now),
            timezoneOffsetMinutes: now.getTimezoneOffset(),
          },
        ],
        concepts: updateConceptProgress(completed, concept, completedAt),
      },
      now,
    );
  });

  return {
    completedNow,
    progress,
  };
};
