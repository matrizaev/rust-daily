import { useEffect, useMemo, useState } from "react";
import {
  getLessonById,
  loadLesson,
  mergeLesson,
  prefetchLessonDetail,
} from "../content/lessonContent";
import { selectDailyLesson } from "../progression/selectDailyLesson";
import type { Concept, Lesson, LessonIndexEntry } from "../types/lesson";
import type { ProgressStore } from "../types/progress";
import type { AppRoute } from "./routes";

const findConcept = (
  lesson: Lesson | LessonIndexEntry,
  concepts: Concept[],
) => concepts.find((concept) => concept.id === lesson.conceptId) ?? null;

const nextLessonId = (lessons: LessonIndexEntry[], lessonId: string) => {
  const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);

  if (currentIndex < 0) {
    return null;
  }

  return lessons[currentIndex + 1]?.id ?? null;
};

export const useLessonSelection = (
  route: AppRoute,
  progress: ProgressStore,
  lessons: LessonIndexEntry[],
  concepts: Concept[],
) => {
  const dailyLesson = useMemo(
    () => selectDailyLesson(lessons, progress),
    [lessons, progress],
  );

  const requestedLesson = useMemo(
    () => (route.kind === "lesson" ? getLessonById(route.lessonId) : null),
    [route],
  );

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [isLessonLoading, setIsLessonLoading] = useState(false);
  const [lessonLoadFailed, setLessonLoadFailed] = useState(false);

  useEffect(() => {
    if (route.kind !== "lesson") {
      setActiveLesson(null);
      setIsLessonLoading(false);
      setLessonLoadFailed(false);
      return;
    }

    let isActive = true;
    setActiveLesson(null);
    setIsLessonLoading(true);
    setLessonLoadFailed(false);

    const requestedLessonId = requestedLesson?.id ?? dailyLesson.id;

    const loadActiveLesson = async () => {
      const lesson = await loadLesson(requestedLessonId);

      if (lesson) {
        return lesson;
      }

      if (requestedLessonId === dailyLesson.id) {
        return null;
      }

      const dailyLessonDetail = await loadLesson(dailyLesson.id);

      return dailyLessonDetail
        ? mergeLesson(dailyLesson, dailyLessonDetail)
        : null;
    };

    void loadActiveLesson()
      .then((lesson) => {
        if (!isActive) {
          return;
        }

        setActiveLesson(lesson);
        setIsLessonLoading(false);
      })
      .catch(() => {
        if (!isActive) {
          return;
        }

        setActiveLesson(null);
        setIsLessonLoading(false);
        setLessonLoadFailed(true);
      });

    return () => {
      isActive = false;
    };
  }, [dailyLesson, requestedLesson, route]);

  const activeConcept = useMemo(() => {
    return findConcept(activeLesson ?? requestedLesson ?? dailyLesson, concepts);
  }, [activeLesson, concepts, dailyLesson, requestedLesson]);

  useEffect(() => {
    prefetchLessonDetail(dailyLesson.id);
    const upcomingLessonId = nextLessonId(lessons, dailyLesson.id);

    if (upcomingLessonId) {
      prefetchLessonDetail(upcomingLessonId);
    }
  }, [dailyLesson.id, lessons]);

  useEffect(() => {
    if (!activeLesson) {
      return;
    }

    const upcomingLessonId = nextLessonId(lessons, activeLesson.id);

    if (upcomingLessonId) {
      prefetchLessonDetail(upcomingLessonId);
    }
  }, [activeLesson, lessons]);

  return {
    activeConcept,
    activeLesson,
    dailyLesson,
    isLessonLoading,
    lessonLoadFailed,
  };
};
