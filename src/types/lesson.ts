import type { LessonValidation } from "./validation";

export type Difficulty = "easy" | "medium" | "advanced";

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
  id: string;
  arcId: string;
  arcTitle: string;
  day: number;
  arcLength: number;
  title: string;
  conceptId: string;
  difficulty: Difficulty;
  estimatedMinutes: number;
  scenario: string;
  instructions: string;
  starterCode: string;
  hints: string[];
  validation?: LessonValidation;
};
