import type { LessonCompletion, LocalDate } from "../types/progress";

/** Formats a `Date` as a local `YYYY-MM-DD` progress date. */
export const toLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}` as LocalDate;
};

const dateFromLocalDate = (localDate: string) => {
  const [year, month, day] = localDate.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const addLocalDays = (localDate: string, days: number) => {
  const date = dateFromLocalDate(localDate);
  date.setDate(date.getDate() + days);

  return toLocalDate(date);
};

const dateSetFromCompletions = (completions: LessonCompletion[]) =>
  new Set<string>(completions.map((completion) => completion.localDate));

/** Returns whether the learner has a completion on the current local date. */
export const hasCompletionToday = (
  completions: LessonCompletion[],
  now = new Date(),
) => dateSetFromCompletions(completions).has(toLocalDate(now));

const getStreakStartDate = (completedDates: Set<string>, today: string) => {
  const yesterday = addLocalDays(today, -1);

  if (completedDates.has(today)) {
    return today;
  }

  return completedDates.has(yesterday) ? yesterday : null;
};

const countBackwards = (completedDates: Set<string>, startDate: string) => {
  let count = 0;
  let cursor = startDate;

  while (completedDates.has(cursor)) {
    count += 1;
    cursor = addLocalDays(cursor, -1);
  }

  return count;
};

/** Counts consecutive local completion dates ending today or yesterday. */
export const getCurrentStreak = (
  completions: LessonCompletion[],
  now = new Date(),
) => {
  const completedDates = dateSetFromCompletions(completions);
  const startDate = getStreakStartDate(completedDates, toLocalDate(now));

  return startDate === null ? 0 : countBackwards(completedDates, startDate);
};
