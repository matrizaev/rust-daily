import lessonIndexData from "./lessonIndex.json";
import type { Lesson, LessonDetail, LessonIndexEntry } from "../types/lesson";
import { normalizeLessonIndex } from "./normalizeLessons";

const lessonIndex = normalizeLessonIndex(
  lessonIndexData as LessonIndexEntry[],
) as LessonIndexEntry[];
const lessonDetailCache = new Map<string, LessonDetail>();

const lessonDetailUrl = (lessonId: string) =>
  `${import.meta.env.BASE_URL}content/lessons/${lessonId}.json`;

const mergeLessonDetail = (
  lesson: LessonIndexEntry,
  detail: LessonDetail,
): Lesson => ({
  ...lesson,
  ...detail,
  starterCode:
    detail.starterCode ??
    detail.files.find((file) => file.role === "editable")?.content ??
    "",
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

  const detail = (await response.json()) as LessonDetail;
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
