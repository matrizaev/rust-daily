export type AttemptStatus = "in_progress" | "completed";

export type LessonAttempt = {
  id: string;
  lessonId: string;
  startedAt: string;
  completedAt: string | null;
  status: AttemptStatus;
  validationAttempts: number;
  hintsRevealed: number;
  durationSeconds: number;
};

export type LessonCompletion = {
  lessonId: string;
  conceptId: string;
  completedAt: string;
  localDate: string;
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
  conceptId: string;
  state: ConceptState;
  completedLessons: number;
  successfulReviews: number;
  lastPracticedAt: string | null;
  nextReviewAt: string | null;
};

export type ProgressStore = {
  version: 1;
  createdAt: string;
  updatedAt: string;
  attempts: LessonAttempt[];
  completions: LessonCompletion[];
  concepts: Record<string, ConceptProgress>;
};
