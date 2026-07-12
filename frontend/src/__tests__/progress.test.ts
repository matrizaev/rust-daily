import { afterEach, describe, expect, it, vi } from "vitest";
import { getCurrentStreak, hasCompletionToday, toLocalDate } from "../progress/date";
import {
  getLessonCompletion,
  getProgressSummary,
} from "../progress/progressSelectors";
import {
  ensureLessonAttempt,
  isProgressStore,
  loadProgress,
  recordHintReveal,
  recordLessonCompletion,
  recordValidationAttempt,
  readProgress,
  resetProgress,
} from "../progress/progressStore";
import { selectDailyLesson } from "../progression/selectDailyLesson";
import type { Concept, LessonIndexEntry } from "../types/lesson";
import type { ProgressStore } from "../types/progress";
import type { LessonCompletion } from "../types/progress";

const progress = (
  completions: ProgressStore["completions"] = [],
): ProgressStore => ({
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  attempts: [],
  completions,
  concepts: {},
} as unknown as ProgressStore);

const completion = (
  lessonId: string,
  localDate: string,
  conceptId = "ownership",
): LessonCompletion => ({
  lessonId,
  conceptId,
  completedAt: `${localDate}T12:00:00.000Z`,
  localDate,
  timezoneOffsetMinutes: 0,
} as LessonCompletion);

const lesson = (id: string, order: number): LessonIndexEntry => ({
  schemaVersion: 1,
  id,
  arcId: "arc",
  arcTitle: "Arc",
  order,
  day: order,
  arcLength: 3,
  title: `Lesson ${order}`,
  conceptId: "ownership",
  difficulty: "easy",
  estimatedMinutes: 5,
  scenario: "Scenario",
});

const concept: Concept = {
  id: "ownership",
  name: "Ownership",
  description: "Own values",
  prerequisites: [],
  difficulty: ["easy"],
  lessonIds: ["lesson-1", "lesson-2"],
  tags: ["ownership"],
  masteryThreshold: 2,
};

afterEach(() => {
  vi.useRealTimers();
  window.localStorage.clear();
});

describe("date progress helpers", () => {
  it("formats local dates and detects today's completion", () => {
    const now = new Date(2026, 6, 9, 8, 30);

    expect(toLocalDate(now)).toBe("2026-07-09");
    expect(hasCompletionToday([completion("lesson-1", "2026-07-09")], now))
      .toBe(true);
    expect(hasCompletionToday([completion("lesson-1", "2026-07-08")], now))
      .toBe(false);
  });

  it("counts streak from today or yesterday only", () => {
    const now = new Date(2026, 6, 11, 8, 30);

    expect(
      getCurrentStreak(
        [
          completion("lesson-1", "2026-07-11"),
          completion("lesson-2", "2026-07-10"),
          completion("lesson-3", "2026-07-08"),
        ],
        now,
      ),
    ).toBe(2);
    expect(getCurrentStreak([completion("lesson-1", "2026-07-10")], now)).toBe(1);
    expect(getCurrentStreak([completion("lesson-1", "2026-07-09")], now)).toBe(0);
  });
});

describe("progress selectors", () => {
  it("summarizes completed lessons, concepts, and today state", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 6, 11, 12, 0));

    const store = {
      ...progress([
        completion("lesson-1", "2026-07-10"),
        completion("lesson-2", "2026-07-11", "errors"),
      ]),
      concepts: {
        ownership: {
          conceptId: "ownership",
          state: "introduced",
          completedLessons: 1,
          successfulReviews: 0,
          lastPracticedAt: null,
          nextReviewAt: null,
        },
        errors: {
          conceptId: "errors",
          state: "introduced",
          completedLessons: 2,
          successfulReviews: 0,
          lastPracticedAt: null,
          nextReviewAt: null,
        },
      },
    } as unknown as ProgressStore;

    expect(getProgressSummary(store)).toEqual({
      currentStreak: 2,
      completedToday: true,
      completedLessons: 2,
      conceptsIntroduced: 2,
    });
    expect(getLessonCompletion(store, "lesson-2")).toMatchObject({
      lessonId: "lesson-2",
    });
    expect(getLessonCompletion(store, "missing")).toBeNull();
  });
});

describe("progress store", () => {
  it("loads empty progress and rejects malformed progress records", () => {
    expect(loadProgress()).toMatchObject({
      version: 1,
      attempts: [],
      completions: [],
      concepts: {},
    });
    expect(isProgressStore({ version: 1 })).toBe(false);
    expect(isProgressStore(progress())).toBe(true);
  });

  it("rejects contradictory attempts, invalid calendar dates, and negative counters", () => {
    const completedAt = "2026-07-11T12:00:00.000Z";
    const validAttempt = {
      id: "lesson-1:attempt",
      lessonId: "lesson-1",
      startedAt: "2026-07-11T11:00:00.000Z",
      completedAt,
      status: "completed" as const,
      validationAttempts: 1,
      hintsRevealed: 0,
      durationSeconds: 3600,
    };
    const valid = {
      ...progress(),
      attempts: [validAttempt],
      completions: [completion("lesson-1", "2026-07-11")],
      concepts: {
        ownership: {
          conceptId: "ownership",
          state: "introduced" as const,
          completedLessons: 1,
          successfulReviews: 0,
          lastPracticedAt: completedAt,
          nextReviewAt: null,
        },
      },
    };

    expect(isProgressStore(valid)).toBe(true);
    expect(isProgressStore({
      ...valid,
      attempts: [{ ...validAttempt, status: "in_progress", completedAt }],
    })).toBe(false);
    expect(isProgressStore({
      ...valid,
      attempts: [{ ...validAttempt, validationAttempts: -1 }],
    })).toBe(false);
    expect(isProgressStore({
      ...valid,
      completions: [{ ...valid.completions[0], localDate: "2026-02-31" }],
    })).toBe(false);
    expect(isProgressStore({ ...valid, createdAt: "1" })).toBe(false);
  });

  it("does not overwrite invalid persisted progress during an update", () => {
    const invalid = "{not-json";
    window.localStorage.setItem("rust-daily:v1:progress", invalid);

    expect(readProgress()).toMatchObject({ ok: false, reason: "invalid" });
    expect(recordValidationAttempt("lesson-1")).toMatchObject({
      ok: false,
      reason: "invalid",
    });
    expect(window.localStorage.getItem("rust-daily:v1:progress")).toBe(invalid);
  });

  it("records attempts, validation count, hints, and completions", () => {
    const started = new Date("2026-07-11T10:00:00.000Z");
    const completed = new Date("2026-07-11T10:01:30.000Z");

    ensureLessonAttempt("lesson-1", started);
    recordValidationAttempt("lesson-1", started);
    recordHintReveal("lesson-1", 2, started);
    recordHintReveal("lesson-1", 1, started);

    const firstCompletion = recordLessonCompletion(
      {
        ...lesson("lesson-1", 1),
        instructions: "Do work",
        starterCode: "",
        files: [],
        hints: [],
        completionExplanation: "Done",
      },
      concept,
      completed,
    );

    expect(firstCompletion.completedNow).toBe(true);
    expect(firstCompletion.progress.attempts[0]).toMatchObject({
      lessonId: "lesson-1",
      status: "completed",
      validationAttempts: 1,
      hintsRevealed: 2,
      durationSeconds: 90,
    });
    expect(firstCompletion.progress.completions).toHaveLength(1);
    expect(firstCompletion.progress.concepts.ownership).toMatchObject({
      completedLessons: 1,
      state: "introduced",
    });

    const duplicate = recordLessonCompletion(
      {
        ...lesson("lesson-1", 1),
        instructions: "Do work",
        starterCode: "",
        files: [],
        hints: [],
        completionExplanation: "Done",
      },
      concept,
      completed,
    );

    expect(duplicate.completedNow).toBe(false);
    expect(duplicate.progress.completions).toHaveLength(1);

    resetProgress();
    expect(loadProgress().attempts).toEqual([]);
  });
});

describe("daily lesson selection", () => {
  it("chooses the first incomplete lesson by order", () => {
    const lessons = [lesson("lesson-2", 2), lesson("lesson-1", 1)];

    expect(selectDailyLesson(lessons, progress()).id).toBe("lesson-1");
    expect(
      selectDailyLesson(lessons, progress([completion("lesson-1", "2026-07-11")]))
        .id,
    ).toBe("lesson-2");
  });

  it("rotates completed lessons by day index", () => {
    const lessons = [lesson("lesson-1", 1), lesson("lesson-2", 2)];
    const completed = progress([
      completion("lesson-1", "2026-07-10"),
      completion("lesson-2", "2026-07-10"),
    ]);

    expect(selectDailyLesson(lessons, completed, new Date("2026-01-01")).id).toBe(
      "lesson-1",
    );
    expect(selectDailyLesson(lessons, completed, new Date("2026-01-02")).id).toBe(
      "lesson-2",
    );
  });
});
