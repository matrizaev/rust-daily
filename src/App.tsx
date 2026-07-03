import { useCallback, useEffect, useMemo, useState } from "react";
import conceptsData from "./content/concepts.json";
import lessonsData from "./content/lessons.json";
import DailyHome from "./components/DailyHome";
import LessonScreen from "./components/LessonScreen";
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

function App() {
  const todayLesson = lessons[0];
  const [activeLessonId, setActiveLessonId] = useActiveLessonId();

  const activeLesson = useMemo(
    () =>
      lessons.find((lesson) => lesson.id === activeLessonId) ??
      (activeLessonId ? todayLesson : null),
    [activeLessonId, todayLesson],
  );

  const activeConcept = useMemo(() => {
    return findConcept(activeLesson ?? todayLesson);
  }, [activeLesson, todayLesson]);

  const handleContinue = useCallback(() => {
    window.location.hash = lessonHash(todayLesson.id);
    setActiveLessonId(todayLesson.id);
  }, [todayLesson.id]);

  const handleReturnHome = useCallback(() => {
    window.location.hash = "";
    setActiveLessonId(null);
  }, []);

  if (activeLesson) {
    return (
      <LessonScreen
        concept={activeConcept}
        lesson={activeLesson}
        onReturnHome={handleReturnHome}
      />
    );
  }

  return (
    <DailyHome
      concept={activeConcept}
      lesson={todayLesson}
      onContinue={handleContinue}
    />
  );
}

export default App;
