import type {
  Lesson,
  LessonFile,
  LessonHint,
  LessonIndexEntry,
  RawLesson,
} from "../types/lesson";

const DEFAULT_EDITABLE_PATH = "src/lib.rs";

const isLessonHint = (hint: string | LessonHint): hint is LessonHint =>
  typeof hint === "object" && hint !== null;

const normalizeHint = (
  hint: string | LessonHint,
  index: number,
): LessonHint =>
  isLessonHint(hint)
    ? {
        ...hint,
        level: hint.level || index + 1,
      }
    : {
        level: index + 1,
        body: hint,
      };

const getPrimaryEditableFile = (files: LessonFile[]) =>
  files.find((file) => file.role === "editable") ?? null;

const getStarterCode = (lesson: RawLesson, files: LessonFile[]) => {
  if (typeof lesson.starterCode === "string") {
    return lesson.starterCode;
  }

  return getPrimaryEditableFile(files)?.content ?? "";
};

const getFiles = (lesson: RawLesson): LessonFile[] => {
  if (Array.isArray(lesson.files) && lesson.files.length > 0) {
    return lesson.files;
  }

  return [
    {
      path: DEFAULT_EDITABLE_PATH,
      role: "editable",
      content: lesson.starterCode ?? "",
    },
  ];
};

const normalizeLesson = (lesson: RawLesson, index: number): Lesson => {
  const files = getFiles(lesson);
  const starterCode = getStarterCode(lesson, files);

  return {
    ...lesson,
    schemaVersion: lesson.schemaVersion ?? 1,
    order: lesson.order ?? index + 1,
    starterCode,
    files,
    hints: lesson.hints.map(normalizeHint),
  };
};

const normalizeLessons = (lessons: RawLesson[]) =>
  lessons.map((lesson, index) => normalizeLesson(lesson, index));

/** Fills legacy index defaults while preserving generated lesson metadata. */
export const normalizeLessonIndex = (lessons: LessonIndexEntry[]) =>
  lessons.map((lesson, index) => ({
    ...lesson,
    schemaVersion: lesson.schemaVersion ?? 1,
    order: lesson.order ?? index + 1,
  })) satisfies LessonIndexEntry[];
