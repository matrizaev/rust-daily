import type { ProgressStore } from "../types/progress";
import { getCurrentStreak } from "./date";

export type ProgressSummary = {
  currentStreak: number;
  completedLessons: number;
  conceptsIntroduced: number;
};

const getCompletedLessonCount = (progress: ProgressStore) =>
  progress.completions.length;

const getConceptsIntroducedCount = (progress: ProgressStore) =>
  Object.values(progress.concepts).filter(
    (concept) => concept.completedLessons > 0,
  ).length;

export const getProgressSummary = (
  progress: ProgressStore,
): ProgressSummary => ({
  currentStreak: getCurrentStreak(progress.completions),
  completedLessons: getCompletedLessonCount(progress),
  conceptsIntroduced: getConceptsIntroducedCount(progress),
});

export const getLessonCompletion = (
  progress: ProgressStore,
  lessonId: string,
) =>
  progress.completions.find((completion) => completion.lessonId === lessonId) ??
  null;
