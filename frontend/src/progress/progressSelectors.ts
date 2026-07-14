import type { ProgressStore } from "../types/progress";
import { getCurrentStreak, hasCompletionToday } from "./date";

/** Compact progress summary displayed on the home screen. */
export type ProgressSummary = {
  currentStreak: number;
  completedToday: boolean;
  completedLessons: number;
  conceptsIntroduced: number;
};

const getCompletedLessonCount = (progress: ProgressStore) =>
  progress.completions.length;

const getConceptsIntroducedCount = (progress: ProgressStore) =>
  Object.values(progress.concepts).filter(
    (concept) => concept.completedLessons > 0,
  ).length;

/** Builds the home-screen progress summary from the stored progress state. */
export const getProgressSummary = (
  progress: ProgressStore,
): ProgressSummary => ({
  currentStreak: getCurrentStreak(progress.completions),
  completedToday: hasCompletionToday(progress.completions),
  completedLessons: getCompletedLessonCount(progress),
  conceptsIntroduced: getConceptsIntroducedCount(progress),
});

/** Finds a lesson completion record, or `null` when the lesson is incomplete. */
export const getLessonCompletion = (
  progress: ProgressStore,
  lessonId: string,
) =>
  progress.completions.find((completion) => completion.lessonId === lessonId) ??
  null;
