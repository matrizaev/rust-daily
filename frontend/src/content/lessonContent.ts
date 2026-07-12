import lessonIndexData from "./lessonIndex.json";
import contentRevisionData from "./contentRevision.json";
import type {
  Lesson,
  LessonDetail,
  LessonDetailResponse,
  LessonIndexEntry,
} from "../types/lesson";
import { normalizeLessonIndex } from "./normalizeLessons";

const lessonIndex = normalizeLessonIndex(
  lessonIndexData as LessonIndexEntry[],
) as LessonIndexEntry[];
const lessonDetailCache = new Map<string, LessonDetail>();
const CONTENT_REVISION = contentRevisionData.revision;

const lessonDetailUrl = (lessonId: string) =>
  `${import.meta.env.BASE_URL}content/lessons/${encodeURIComponent(lessonId)}.json?v=${CONTENT_REVISION}`;

const mergeLessonDetail = (
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

export const getLessonById = (lessonId: string) =>
  lessonIndex.find((lesson) => lesson.id === lessonId) ?? null;

export const getLessonIndex = () => lessonIndex;

export const mergeLesson = (
  lesson: LessonIndexEntry,
  detail: LessonDetail,
) => mergeLessonDetail(lesson, detail);

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

export const loadLesson = async (lessonId: string) => {
  const lesson = getLessonById(lessonId);

  if (!lesson) {
    return null;
  }

  return mergeLessonDetail(lesson, await loadLessonDetail(lessonId));
};

export const prefetchLessonDetail = (lessonId: string) => {
  if (lessonDetailCache.has(lessonId)) {
    return;
  }

  void loadLessonDetail(lessonId).catch(() => undefined);
};
