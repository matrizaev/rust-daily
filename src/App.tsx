import { useCallback, useEffect, useMemo, useState } from "react";
import conceptsData from "./content/concepts.json";
import lessonsData from "./content/lessons.json";
import DailyHome from "./components/DailyHome";
import LessonScreen from "./components/LessonScreen";
import PwaStatus from "./components/PwaStatus";
import { getProgressSummary } from "./progress/progressSelectors";
import {
  loadProgress,
  resetProgress,
} from "./progress/progressStore";
import { selectDailyLesson } from "./progression/selectDailyLesson";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import type { Concept, Lesson } from "./types/lesson";

const lessons = lessonsData as Lesson[];
const concepts = conceptsData as Concept[];

const lessonHash = (lessonId: string) => `#lesson/${lessonId}`;

const getLessonIdFromHash = () => {
  const hash = window.location.hash;

  return hash.startsWith("#lesson/") ? hash.replace("#lesson/", "") : null;
};

const getValidLessonId = () => {
  const hashLessonId = getLessonIdFromHash();

  return lessons.some((lesson) => lesson.id === hashLessonId)
    ? hashLessonId
    : null;
};

const findConcept = (lesson: Lesson) =>
  concepts.find((concept) => concept.id === lesson.conceptId) ?? null;

const getIsOffline = () => !navigator.onLine;

type UpdateServiceWorker = () => Promise<void>;

const useActiveLessonId = () => {
  const [activeLessonId, setActiveLessonId] = useState<string | null>(() => {
    return getValidLessonId();
  });

  useEffect(() => {
    const handleHashChange = () => {
      setActiveLessonId(getValidLessonId());
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return [activeLessonId, setActiveLessonId] as const;
};

const usePwaState = () => {
  const [isOffline, setIsOffline] = useState(getIsOffline);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateServiceWorker, setUpdateServiceWorker] =
    useState<UpdateServiceWorker | null>(null);

  useEffect(() => {
    const updateOnlineState = () => setIsOffline(getIsOffline());

    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);

    return () => {
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
    };
  }, []);

  useEffect(() => {
    return registerServiceWorker({
      onOfflineReady: () => undefined,
      onUpdateAvailable: (update) => setUpdateServiceWorker(() => update),
    });
  }, []);

  const handleReloadUpdate = useCallback(() => {
    if (!updateServiceWorker) {
      return;
    }

    setIsUpdating(true);
    void updateServiceWorker().catch(() => setIsUpdating(false));
  }, [updateServiceWorker]);

  return {
    isOffline,
    isUpdating,
    updateAvailable: updateServiceWorker !== null,
    handleReloadUpdate,
  };
};

function App() {
  const [activeLessonId, setActiveLessonId] = useActiveLessonId();
  const [progress, setProgress] = useState(() => loadProgress());
  const pwa = usePwaState();
  const dailyLesson = useMemo(
    () => selectDailyLesson(lessons, progress),
    [progress],
  );

  const activeLesson = useMemo(
    () =>
      lessons.find((lesson) => lesson.id === activeLessonId) ??
      (activeLessonId ? dailyLesson : null),
    [activeLessonId, dailyLesson],
  );

  const activeConcept = useMemo(() => {
    return findConcept(activeLesson ?? dailyLesson);
  }, [activeLesson, dailyLesson]);

  const handleContinue = useCallback(() => {
    window.location.hash = lessonHash(dailyLesson.id);
    setActiveLessonId(dailyLesson.id);
  }, [dailyLesson.id]);

  const handleReturnHome = useCallback(() => {
    window.location.hash = "";
    setActiveLessonId(null);
  }, []);

  const handleProgressChange = useCallback(() => {
    setProgress(loadProgress());
  }, []);

  const handleResetProgress = useCallback(() => {
    resetProgress();
    setProgress(loadProgress());
  }, []);

  if (activeLesson) {
    return (
      <>
        <PwaStatus
          isOffline={pwa.isOffline}
          isUpdating={pwa.isUpdating}
          updateAvailable={pwa.updateAvailable}
          onReloadUpdate={pwa.handleReloadUpdate}
        />
        <LessonScreen
          concept={activeConcept}
          lesson={activeLesson}
          onProgressChange={handleProgressChange}
          onReturnHome={handleReturnHome}
          progress={progress}
        />
      </>
    );
  }

  return (
    <>
      <PwaStatus
        isOffline={pwa.isOffline}
        isUpdating={pwa.isUpdating}
        updateAvailable={pwa.updateAvailable}
        onReloadUpdate={pwa.handleReloadUpdate}
      />
      <DailyHome
        concept={activeConcept}
        lesson={dailyLesson}
        onContinue={handleContinue}
        onResetProgress={handleResetProgress}
        summary={getProgressSummary(progress)}
      />
    </>
  );
}

export default App;
