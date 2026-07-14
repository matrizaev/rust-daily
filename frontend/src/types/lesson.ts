import type { LessonValidation } from "./validation";

/** Difficulty labels used for lesson metadata and filtering. */
export type Difficulty = "easy" | "medium" | "advanced";

/** Role a lesson file plays in the learner workspace. */
export type LessonFileRole = "editable" | "readonly" | "test";

/** Source, fixture, or test file included in a lesson snapshot. */
export type LessonFile = {
  path: string;
  role: LessonFileRole;
  content: string;
};

/** Progressive hint content shown during a lesson. */
export type LessonHint = {
  level: number;
  body: string;
  solutionCode?: string;
};

/** Curriculum concept metadata used for ordering and progress. */
export type Concept = {
  id: string;
  name: string;
  description: string;
  prerequisites: string[];
  difficulty: Difficulty[];
  lessonIds: string[];
  tags: string[];
  masteryThreshold: number;
};

/** Complete lesson record used by the lesson screen and validation flow. */
export type Lesson = {
  schemaVersion: 1 | 2;
  id: string;
  arcId: string;
  arcTitle: string;
  order: number;
  day: number;
  arcLength: number;
  title: string;
  conceptId: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  scenario: string;
  instructions: string;
  starterCode: string;
  files: LessonFile[];
  hints: LessonHint[];
  completionExplanation: string;
  validation?: LessonValidation;
};

/** Lightweight lesson metadata loaded up front for navigation. */
export type LessonIndexEntry = Omit<
  Lesson,
  | "starterCode"
  | "files"
  | "hints"
  | "completionExplanation"
  | "validation"
  | "instructions"
>;

/** Lazily loaded lesson detail fields. */
export type LessonDetail = Pick<
  Lesson,
  | "instructions"
  | "starterCode"
  | "files"
  | "hints"
  | "completionExplanation"
  | "validation"
>;

/** Shape of a lesson detail JSON file served from `public/content/lessons`. */
export type LessonDetailResponse = {
  id: string;
  schemaVersion: 1 | 2;
  detail: LessonDetail;
};

/** Canonical generated lesson record before runtime normalization. */
export type RawLesson = Omit<
  Lesson,
  "schemaVersion" | "order" | "starterCode" | "files" | "hints"
> & {
  schemaVersion?: 1 | 2;
  order?: number;
  starterCode?: string;
  files?: LessonFile[];
  hints: string[] | LessonHint[];
};
