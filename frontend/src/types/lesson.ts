import type { LessonValidation } from "./validation";

export type Difficulty = "easy" | "medium" | "advanced";
export type LessonFileRole = "editable" | "readonly" | "test";

export type LessonFile = {
  path: string;
  role: LessonFileRole;
  content: string;
};

export type LessonHint = {
  level: number;
  body: string;
  solutionCode?: string;
};

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
