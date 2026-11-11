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
  recordProgress?: boolean;
  revealedHints: number;
};

export const useLessonProgress = ({
  concept,
  lesson,
  onProgressChange,
  progress,
  recordProgress = true,
  revealedHints,
}: UseLessonProgressOptions) => {
  const [completedNow, setCompletedNow] = useState(false);
  const [progressStorageError, setProgressStorageError] = useState<string | null>(null);
  const completion = recordProgress ? getLessonCompletion(progress, lesson.id) : null;

  useEffect(() => {
    if (!recordProgress) {
      return;
    }

    const handleStorageResult = (event: Event) => {
      const result = (event as CustomEvent<ProgressWriteResult>).detail;

      setProgressStorageError(result.ok ? null : result.reason);
    };

    window.addEventListener(PROGRESS_STORAGE_EVENT, handleStorageResult);

    return () => window.removeEventListener(PROGRESS_STORAGE_EVENT, handleStorageResult);
  }, [recordProgress]);

  useEffect(() => {
    if (recordProgress) {
      ensureLessonAttempt(lesson.id);
      onProgressChange();
    }
    setCompletedNow(false);
  }, [lesson.id, onProgressChange, recordProgress]);

  useEffect(() => {
    if (recordProgress && revealedHints > 0) {
      recordHintReveal(lesson.id, revealedHints);
      onProgressChange();
    }
  }, [lesson.id, onProgressChange, recordProgress, revealedHints]);

  const recordValidation = useCallback(() => {
    if (!recordProgress) {
      return;
    }

    recordValidationAttempt(lesson.id);
    onProgressChange();
  }, [lesson.id, onProgressChange, recordProgress]);

  const recordCompletion = useCallback(() => {
    if (!recordProgress) {
      setCompletedNow(true);
      return;
    }

    const completionResult = recordLessonCompletion(lesson, concept);

    if (completionResult.completedNow) {
      setCompletedNow(true);
    }

    onProgressChange();
  }, [concept, lesson, onProgressChange, recordProgress]);

  return {
    completedNow,
    completion,
    progressStorageError,
    recordCompletion,
    recordValidation,
  };
};
