import type { Concept, Lesson } from "../types/lesson";
import type {
  AttemptStatus,
  ConceptProgress,
  ConceptState,
  IsoTimestamp,
  LessonAttempt,
  LessonCompletion,
  LocalDate,
  NonNegativeInteger,
  ProgressAttemptId,
  ProgressConceptId,
  ProgressLessonId,
  ProgressStore,
} from "../types/progress";
import { toLocalDate } from "./date";

const PROGRESS_KEY = "rust-daily:v1:progress";
export const PROGRESS_STORAGE_EVENT = "rust-daily:progress-storage";

export type ProgressWriteResult =
  | { ok: true }
  | { ok: false; reason: "quota" | "unavailable" | "invalid" };

export type ProgressReadResult =
  | { ok: true; progress: ProgressStore }
  | { ok: false; reason: "unavailable" | "invalid"; progress: ProgressStore };

const nowIso = (now = new Date()) => now.toISOString() as IsoTimestamp;
const progressLessonId = (value: string) => value as ProgressLessonId;
const progressConceptId = (value: string) => value as ProgressConceptId;
const nonNegativeInteger = (value: number) => value as NonNegativeInteger;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isString = (value: unknown): value is string =>
  typeof value === "string";

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const isNonNegativeInteger = (value: unknown): value is NonNegativeInteger =>
  isNumber(value) && Number.isInteger(value) && value >= 0;

const isIsoDate = (value: unknown): value is IsoTimestamp =>
  isString(value) &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString() === value;

const isLocalDate = (value: unknown): value is LocalDate => {
  if (!isString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
};

const isArrayOf = <T>(
  value: unknown,
  guard: (item: unknown) => item is T,
): value is T[] => Array.isArray(value) && value.every(guard);

const hasStringFields = (
  value: Record<string, unknown>,
  fields: string[],
) => fields.every((field) => isString(value[field]));

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
  isIsoDate(value.createdAt) && isIsoDate(value.updatedAt);

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
    hasStringFields(value, ["id", "lessonId"]) && isIsoDate(value.startedAt),
  (value: Record<string, unknown>) =>
    [
      "validationAttempts",
      "hintsRevealed",
      "durationSeconds",
    ].every((field) => isNonNegativeInteger(value[field])),
  (value: Record<string, unknown>) =>
    (value.status === "in_progress" && value.completedAt === null) ||
    (value.status === "completed" && isIsoDate(value.completedAt)),
  (value: Record<string, unknown>) => isAttemptStatus(value.status),
];

const hasAttemptFields = (value: Record<string, unknown>) =>
  attemptValidators.every((validator) => validator(value));

const isLessonAttempt = (value: unknown): value is LessonAttempt =>
  isRecord(value) && hasAttemptFields(value);

const isLessonCompletion = (value: unknown): value is LessonCompletion =>
  isRecord(value) &&
  hasStringFields(value, ["lessonId", "conceptId"]) &&
  isIsoDate(value.completedAt) &&
  isLocalDate(value.localDate) &&
  isNumber(value.timezoneOffsetMinutes) &&
  Number.isInteger(value.timezoneOffsetMinutes) &&
  value.timezoneOffsetMinutes >= -14 * 60 &&
  value.timezoneOffsetMinutes <= 14 * 60;

const isConceptState = (value: unknown): value is ConceptState =>
  isString(value) && CONCEPT_STATES.has(value);

const conceptProgressValidators = [
  (value: Record<string, unknown>) => hasStringFields(value, ["conceptId"]),
  (value: Record<string, unknown>) =>
    ["completedLessons", "successfulReviews"].every((field) => isNonNegativeInteger(value[field])),
  (value: Record<string, unknown>) => isConceptState(value.state),
  (value: Record<string, unknown>) => value.lastPracticedAt === null || isIsoDate(value.lastPracticedAt),
  (value: Record<string, unknown>) => value.nextReviewAt === null || isIsoDate(value.nextReviewAt),
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

const hasCrossRecordInvariants = (value: Record<string, unknown>) => {
  const attempts = value.attempts as LessonAttempt[];
  const completions = value.completions as LessonCompletion[];
  const attemptLessonIds = new Set(attempts.map((attempt) => attempt.lessonId));
  const completionLessonIds = new Set(completions.map((completion) => completion.lessonId));
  const concepts = value.concepts as Record<string, ConceptProgress>;
  return new Set(attempts.map((attempt) => attempt.id)).size === attempts.length &&
    attemptLessonIds.size === attempts.length &&
    completionLessonIds.size === completions.length &&
    attempts.every((attempt) =>
      attempt.status === "in_progress" || new Date(attempt.startedAt) <= new Date(attempt.completedAt)) &&
    completions.every((completion) => attempts.some((attempt) =>
      attempt.lessonId === completion.lessonId && attempt.status === "completed" && attempt.completedAt === completion.completedAt,
    )) &&
    Object.entries(concepts).every(([conceptId, concept]) => concept.conceptId === conceptId) &&
    completions.every((completion) => concepts[completion.conceptId] !== undefined) &&
    Object.values(concepts).every((concept) =>
      concept.completedLessons === completions.filter((completion) => completion.conceptId === concept.conceptId).length);
};

export const isProgressStore = (value: unknown): value is ProgressStore =>
  isRecord(value) && hasProgressStoreFields(value) && hasCrossRecordInvariants(value);

export const readProgress = (): ProgressReadResult => {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(PROGRESS_KEY);
  } catch {
    return { ok: false, reason: "unavailable", progress: createProgressStore() };
  }
  if (!raw) {
    return { ok: true, progress: createProgressStore() };
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isProgressStore(parsed)
      ? { ok: true, progress: parsed }
      : { ok: false, reason: "invalid", progress: createProgressStore() };
  } catch {
    return { ok: false, reason: "invalid", progress: createProgressStore() };
  }
};

export const loadProgress = () => readProgress().progress;

const notifyProgressStorage = (result: ProgressWriteResult) => {
  window.dispatchEvent(new CustomEvent(PROGRESS_STORAGE_EVENT, { detail: result }));
  return result;
};

const saveProgress = (progress: ProgressStore): ProgressWriteResult => {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    return notifyProgressStorage({ ok: true });
  } catch (error) {
    return notifyProgressStorage({
      ok: false,
      reason: error instanceof DOMException && error.name === "QuotaExceededError"
        ? "quota"
        : "unavailable",
    });
  }
};

export const replaceProgress = (progress: ProgressStore) =>
  saveProgress(progress);

export const resetProgress = () => {
  try {
    window.localStorage.removeItem(PROGRESS_KEY);
    return notifyProgressStorage({ ok: true });
  } catch {
    return notifyProgressStorage({ ok: false, reason: "unavailable" });
  }
};

const updateProgress = (update: (progress: ProgressStore) => ProgressStore) => {
  const current = readProgress();
  if (!current.ok) {
    return {
      ...notifyProgressStorage({ ok: false, reason: current.reason }),
      progress: current.progress,
    };
  }
  const next = update(current.progress);
  const result = saveProgress(next);

  return { ...result, progress: next };
};

const touch = (progress: ProgressStore, now: Date): ProgressStore => ({
  ...progress,
  updatedAt: nowIso(now),
});

const attemptId = (lessonId: string, now: Date) =>
  `${lessonId}:${nowIso(now)}` as ProgressAttemptId;

const createAttempt = (lessonId: string, now: Date) => ({
  id: attemptId(lessonId, now),
  lessonId: lessonId as ProgressLessonId,
  startedAt: nowIso(now),
  completedAt: null,
  status: "in_progress" as const,
  validationAttempts: nonNegativeInteger(0),
  hintsRevealed: nonNegativeInteger(0),
  durationSeconds: nonNegativeInteger(0),
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

  return nonNegativeInteger(Math.max(0, Math.round(durationMs / 1000)));
};

const hasCompletion = (progress: ProgressStore, lessonId: string) =>
  progress.completions.some((completion) => completion.lessonId === lessonId);

const initialConceptProgress = (conceptId: string): ConceptProgress => ({
  conceptId: progressConceptId(conceptId),
  state: "introduced",
  completedLessons: nonNegativeInteger(0),
  successfulReviews: nonNegativeInteger(0),
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
  completedAt: IsoTimestamp,
) => {
  const current =
    progress.concepts[concept.id] ?? initialConceptProgress(concept.id);
  const completedLessons = nonNegativeInteger(current.completedLessons + 1);

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
  completedAt: IsoTimestamp,
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
          validationAttempts: nonNegativeInteger(attempt.validationAttempts + 1),
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
          hintsRevealed: nonNegativeInteger(Math.max(attempt.hintsRevealed, hintsRevealed)),
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
  const result = updateProgress((current) => {
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
            lessonId: progressLessonId(lesson.id),
            conceptId: progressConceptId(lesson.conceptId),
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
    progress: result.progress,
    persistence: result.ok ? { ok: true as const } : result,
  };
};
