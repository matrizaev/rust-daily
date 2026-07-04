import { toLocalDate } from "../progress/date";
import type { Lesson } from "../types/lesson";
import type { ProgressStore } from "../types/progress";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const EPOCH_DAY = "2026-01-01";

const getCompletedLessonIds = (progress: ProgressStore) =>
  new Set(progress.completions.map((completion) => completion.lessonId));

const dayIndex = (now: Date) => {
  const start = Date.parse(`${EPOCH_DAY}T00:00:00Z`);
  const today = Date.parse(`${toLocalDate(now)}T00:00:00Z`);

  return Math.max(0, Math.floor((today - start) / MS_PER_DAY));
};

const firstIncompleteLesson = (
  lessons: Lesson[],
  completedLessonIds: Set<string>,
) => lessons.find((lesson) => !completedLessonIds.has(lesson.id)) ?? null;

export const selectDailyLesson = (
  lessons: Lesson[],
  progress: ProgressStore,
  now = new Date(),
) => {
  const incomplete = firstIncompleteLesson(lessons, getCompletedLessonIds(progress));

  if (incomplete) {
    return incomplete;
  }

  return lessons[dayIndex(now) % lessons.length];
};
