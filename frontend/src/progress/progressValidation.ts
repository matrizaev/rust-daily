import type {
  ConceptProgress,
  LessonAttempt,
  LessonCompletion,
  ProgressStore,
} from "../types/progress";
import {
  isConceptProgress,
  isLessonAttempt,
  isLessonCompletion,
} from "./progressEntryValidation";
import {
  isArrayOf,
  isIsoDate,
  isRecord,
} from "./progressFieldGuards";

const hasProgressVersion = (value: Record<string, unknown>) =>
  value.version === 1;

const hasProgressTimestamps = (value: Record<string, unknown>) =>
  isIsoDate(value.createdAt) && isIsoDate(value.updatedAt);

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
