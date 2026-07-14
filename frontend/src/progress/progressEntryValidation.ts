import type {
  AttemptStatus,
  ConceptProgress,
  ConceptState,
  LessonAttempt,
  LessonCompletion,
} from "../types/progress";
import {
  hasStringFields,
  isIsoDate,
  isLocalDate,
  isNonNegativeInteger,
  isNumber,
  isRecord,
  isString,
} from "./progressFieldGuards";

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

export const isLessonAttempt = (value: unknown): value is LessonAttempt =>
  isRecord(value) && hasAttemptFields(value);

export const isLessonCompletion = (
  value: unknown,
): value is LessonCompletion =>
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

export const isConceptProgress = (
  value: unknown,
): value is ConceptProgress =>
  isRecord(value) && hasConceptProgressFields(value);
