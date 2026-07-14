import { useCallback } from "react";
import { prefetchLessonDetail } from "../content/lessonContent";
import { loadLessonScreen, loadSettingsScreen } from "./lazyScreens";
import {
  lessonHash,
  settingsHash,
  type AppRoute,
} from "./routes";

export const useNavigationActions = (
  setRoute: (route: AppRoute) => void,
  dailyLessonId: string,
) => {
  const handleOpenLesson = useCallback((lessonId: string) => {
    void loadLessonScreen();
    prefetchLessonDetail(lessonId);
    window.location.hash = lessonHash(lessonId);
    setRoute({ kind: "lesson", lessonId });
  }, [setRoute]);

  const handleContinue = useCallback(() => {
    handleOpenLesson(dailyLessonId);
  }, [dailyLessonId, handleOpenLesson]);

  const handleReturnHome = useCallback(() => {
    window.location.hash = "";
    setRoute({ kind: "home" });
  }, [setRoute]);

  const handleOpenSettings = useCallback(() => {
    void loadSettingsScreen();
    window.location.hash = settingsHash;
    setRoute({ kind: "settings" });
  }, [setRoute]);

  return {
    handleContinue,
    handleOpenLesson,
    handleOpenSettings,
    handleReturnHome,
  };
};
