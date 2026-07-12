export type AttemptStatus = "in_progress" | "completed";

declare const progressBrand: unique symbol;
type Brand<Value, Name extends string> = Value & { readonly [progressBrand]: Name };

export type ProgressAttemptId = Brand<string, "ProgressAttemptId">;
export type ProgressLessonId = Brand<string, "ProgressLessonId">;
export type ProgressConceptId = Brand<string, "ProgressConceptId">;
export type IsoTimestamp = Brand<string, "IsoTimestamp">;
export type LocalDate = Brand<string, "LocalDate">;
export type NonNegativeInteger = Brand<number, "NonNegativeInteger">;

type LessonAttemptBase = {
  id: ProgressAttemptId;
  lessonId: ProgressLessonId;
  startedAt: IsoTimestamp;
  validationAttempts: NonNegativeInteger;
  hintsRevealed: NonNegativeInteger;
  durationSeconds: NonNegativeInteger;
};

export type LessonAttempt =
  | (LessonAttemptBase & { status: "in_progress"; completedAt: null })
  | (LessonAttemptBase & { status: "completed"; completedAt: IsoTimestamp });

export type LessonCompletion = {
  lessonId: ProgressLessonId;
  conceptId: ProgressConceptId;
  completedAt: IsoTimestamp;
  localDate: LocalDate;
  timezoneOffsetMinutes: number;
};

export type ConceptState =
  | "locked"
  | "introduced"
  | "practicing"
  | "comfortable"
  | "review_due"
  | "mastered";

export type ConceptProgress = {
  conceptId: ProgressConceptId;
  state: ConceptState;
  completedLessons: NonNegativeInteger;
  successfulReviews: NonNegativeInteger;
  lastPracticedAt: IsoTimestamp | null;
  nextReviewAt: IsoTimestamp | null;
};

export type ProgressStore = {
  version: 1;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  attempts: LessonAttempt[];
  completions: LessonCompletion[];
  concepts: Record<string, ConceptProgress>;
};
