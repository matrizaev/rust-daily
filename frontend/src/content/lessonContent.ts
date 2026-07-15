import lessonIndexData from "./lessonIndex.json";
import contentRevisionData from "./contentRevision.json";
import type {
  Lesson,
  LessonDetail,
  LessonDetailResponse,
  LessonIndexEntry,
} from "../types/lesson";

const lessonIndex = lessonIndexData as LessonIndexEntry[];
const lessonDetailCache = new Map<string, LessonDetail>();
const CONTENT_REVISION = contentRevisionData.revision;

const lessonDetailUrl = (lessonId: string) =>
  `${import.meta.env.BASE_URL}content/lessons/${encodeURIComponent(lessonId)}.json?v=${CONTENT_REVISION}`;

/** Looks up lightweight lesson metadata by ID. */
export const getLessonById = (lessonId: string) =>
  lessonIndex.find((lesson) => lesson.id === lessonId) ?? null;

/** Returns the normalized lesson index used for navigation. */
export const getLessonIndex = () => lessonIndex;

/** Combines index metadata with lazily loaded lesson detail. */
export const mergeLesson = (
  lesson: LessonIndexEntry,
  detail: LessonDetail,
): Lesson => ({
  ...lesson,
  instructions: detail.instructions,
  files: detail.files,
  hints: detail.hints,
  completionExplanation: detail.completionExplanation,
  validation: detail.validation,
  starterCode: detail.starterCode,
});

const loadLessonDetail = async (lessonId: string) => {
  const cached = lessonDetailCache.get(lessonId);

  if (cached) {
    return cached;
  }

  const response = await fetch(lessonDetailUrl(lessonId), {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(`Failed to load lesson detail for ${lessonId}.`);
  }

  const { detail } = await response.json() as LessonDetailResponse;
  lessonDetailCache.set(lessonId, detail);

  return detail;
};

/** Loads a complete lesson record, returning `null` for an unknown ID. */
export const loadLesson = async (lessonId: string) => {
  const lesson = getLessonById(lessonId);

  if (!lesson) {
    return null;
  }

  return mergeLesson(lesson, await loadLessonDetail(lessonId));
};

/** Starts a best-effort lesson detail fetch for a likely future route. */
export const prefetchLessonDetail = (lessonId: string) => {
  if (lessonDetailCache.has(lessonId)) {
    return;
  }

  void loadLessonDetail(lessonId).catch(() => undefined);
};
