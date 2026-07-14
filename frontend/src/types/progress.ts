/** Status of a single lesson attempt. */
export type AttemptStatus = "in_progress" | "completed";

declare const progressBrand: unique symbol;
type Brand<Value, Name extends string> = Value & { readonly [progressBrand]: Name };

/** Branded identifier for progress attempts. */
export type ProgressAttemptId = Brand<string, "ProgressAttemptId">;
/** Branded lesson identifier stored in progress data. */
export type ProgressLessonId = Brand<string, "ProgressLessonId">;
/** Branded concept identifier stored in progress data. */
export type ProgressConceptId = Brand<string, "ProgressConceptId">;
/** ISO-8601 UTC timestamp string. */
export type IsoTimestamp = Brand<string, "IsoTimestamp">;
/** Local calendar date in `YYYY-MM-DD` form. */
export type LocalDate = Brand<string, "LocalDate">;
/** Number validated as a non-negative integer. */
export type NonNegativeInteger = Brand<number, "NonNegativeInteger">;

type LessonAttemptBase = {
  id: ProgressAttemptId;
  lessonId: ProgressLessonId;
  startedAt: IsoTimestamp;
  validationAttempts: NonNegativeInteger;
  hintsRevealed: NonNegativeInteger;
  durationSeconds: NonNegativeInteger;
};

/** Attempt record for one lesson. */
export type LessonAttempt =
  | (LessonAttemptBase & { status: "in_progress"; completedAt: null })
  | (LessonAttemptBase & { status: "completed"; completedAt: IsoTimestamp });

/** Completion record used for streaks, summaries, and concept progress. */
export type LessonCompletion = {
  lessonId: ProgressLessonId;
  conceptId: ProgressConceptId;
  completedAt: IsoTimestamp;
  localDate: LocalDate;
  timezoneOffsetMinutes: number;
};

/** Review state for a curriculum concept. */
export type ConceptState =
  | "locked"
  | "introduced"
  | "practicing"
  | "comfortable"
  | "review_due"
  | "mastered";

/** Stored progress for one concept. */
export type ConceptProgress = {
  conceptId: ProgressConceptId;
  state: ConceptState;
  completedLessons: NonNegativeInteger;
  successfulReviews: NonNegativeInteger;
  lastPracticedAt: IsoTimestamp | null;
  nextReviewAt: IsoTimestamp | null;
};

/** Versioned browser-local progress store. */
export type ProgressStore = {
  version: 1;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  attempts: LessonAttempt[];
  completions: LessonCompletion[];
  concepts: Record<string, ConceptProgress>;
};
