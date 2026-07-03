import type { LessonCompletion } from "../types/progress";

const padDatePart = (value: number) => String(value).padStart(2, "0");

export const toLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());

  return `${year}-${month}-${day}`;
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
  new Set(completions.map((completion) => completion.localDate));

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

export const getCurrentStreak = (
  completions: LessonCompletion[],
  now = new Date(),
) => {
  const completedDates = dateSetFromCompletions(completions);
  const startDate = getStreakStartDate(completedDates, toLocalDate(now));

  return startDate === null ? 0 : countBackwards(completedDates, startDate);
};
