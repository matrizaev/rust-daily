import { useCallback, useEffect, useState } from "react";
import {
  getLessonCompletion,
} from "../../progress/progressSelectors";
import {
  ensureLessonAttempt,
  PROGRESS_STORAGE_EVENT,
  recordHintReveal,
  recordLessonCompletion,
  recordValidationAttempt,
  type ProgressWriteResult,
} from "../../progress/progressStore";
import type { Concept, Lesson } from "../../types/lesson";
import type { ProgressStore } from "../../types/progress";

type UseLessonProgressOptions = {
  concept: Concept | null;
  lesson: Lesson;
  onProgressChange: () => void;
  progress: ProgressStore;
  revealedHints: number;
};

export const useLessonProgress = ({
  concept,
  lesson,
  onProgressChange,
  progress,
  revealedHints,
}: UseLessonProgressOptions) => {
  const [completedNow, setCompletedNow] = useState(false);
  const [progressStorageError, setProgressStorageError] = useState<string | null>(null);
  const completion = getLessonCompletion(progress, lesson.id);

  useEffect(() => {
    const handleStorageResult = (event: Event) => {
      const result = (event as CustomEvent<ProgressWriteResult>).detail;

      setProgressStorageError(result.ok ? null : result.reason);
    };

    window.addEventListener(PROGRESS_STORAGE_EVENT, handleStorageResult);

    return () => window.removeEventListener(PROGRESS_STORAGE_EVENT, handleStorageResult);
  }, []);

  useEffect(() => {
    ensureLessonAttempt(lesson.id);
    onProgressChange();
    setCompletedNow(false);
  }, [lesson.id, onProgressChange]);

  useEffect(() => {
    if (revealedHints > 0) {
      recordHintReveal(lesson.id, revealedHints);
      onProgressChange();
    }
  }, [lesson.id, onProgressChange, revealedHints]);

  const recordValidation = useCallback(() => {
    recordValidationAttempt(lesson.id);
    onProgressChange();
  }, [lesson.id, onProgressChange]);

  const recordCompletion = useCallback(() => {
    const completionResult = recordLessonCompletion(lesson, concept);

    if (completionResult.completedNow) {
      setCompletedNow(true);
    }

    onProgressChange();
  }, [concept, lesson, onProgressChange]);

  return {
    completedNow,
    completion,
    progressStorageError,
    recordCompletion,
    recordValidation,
  };
};
