import type { Concept, Lesson } from "../types/lesson";
import type {
  ConceptProgress,
  ConceptState,
  IsoTimestamp,
  ProgressAttemptId,
  ProgressStore,
} from "../types/progress";
import { toLocalDate } from "./date";
import { updateProgress } from "./progressPersistence";
import {
  nonNegativeInteger,
  nowIso,
  progressConceptId,
  progressLessonId,
} from "./progressPrimitives";

const touch = (progress: ProgressStore, now: Date): ProgressStore => ({
  ...progress,
  updatedAt: nowIso(now),
});

const attemptId = (lessonId: string, now: Date) =>
  `${lessonId}:${nowIso(now)}` as ProgressAttemptId;

const createAttempt = (lessonId: string, now: Date) => ({
  id: attemptId(lessonId, now),
  lessonId: progressLessonId(lessonId),
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
