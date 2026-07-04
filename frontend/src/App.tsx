import { useCallback, useEffect, useMemo, useState } from "react";
import conceptsData from "./content/concepts.json";
import lessonsData from "./content/lessons.json";
import DailyHome from "./components/DailyHome";
import LessonScreen from "./components/LessonScreen";
import PwaStatus from "./components/PwaStatus";
import SettingsScreen from "./components/SettingsScreen";
import { getProgressSummary } from "./progress/progressSelectors";
import {
  loadProgress,
  replaceProgress,
  resetProgress,
} from "./progress/progressStore";
import { selectDailyLesson } from "./progression/selectDailyLesson";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import {
  downloadProgressExport,
  readProgressExportFile,
} from "./storage/progressPortability";
import { clearAllDrafts } from "./storage/draftStore";
import {
  loadSettings,
  resolveThemePreference,
  saveSettings,
  type EffectiveTheme,
  type UserSettings,
} from "./storage/settingsStore";
import type { Concept, Lesson } from "./types/lesson";

const lessons = lessonsData as Lesson[];
const concepts = conceptsData as Concept[];

const lessonHash = (lessonId: string) => `#lesson/${lessonId}`;
const settingsHash = "#settings";

const getLessonIdFromHash = () => {
  const hash = window.location.hash;

  return hash.startsWith("#lesson/") ? hash.replace("#lesson/", "") : null;
};

type AppRoute =
  | {
      kind: "home";
    }
  | {
      kind: "settings";
    }
  | {
      kind: "lesson";
      lessonId: string;
    };

const getRouteFromHash = (): AppRoute => {
  if (window.location.hash === settingsHash) {
    return { kind: "settings" };
  }

  const hashLessonId = getLessonIdFromHash();

  if (hashLessonId && lessons.some((lesson) => lesson.id === hashLessonId)) {
    return { kind: "lesson", lessonId: hashLessonId };
  }

  return { kind: "home" };
};

const findConcept = (lesson: Lesson) =>
  concepts.find((concept) => concept.id === lesson.conceptId) ?? null;

const getIsOffline = () => !navigator.onLine;

type UpdateServiceWorker = () => Promise<void>;

const useAppRoute = () => {
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getRouteFromHash());
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return [route, setRoute] as const;
};

const getSystemTheme = (): EffectiveTheme => resolveThemePreference("system");

const useEffectiveTheme = (settings: UserSettings) => {
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(getSystemTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () =>
      setSystemTheme(media.matches ? "dark" : "light");

    updateSystemTheme();
    media.addEventListener("change", updateSystemTheme);

    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  return settings.theme === "system" ? systemTheme : settings.theme;
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

const useSettingsState = () => {
  const [settings, setSettings] = useState(() => loadSettings());
  const effectiveTheme = useEffectiveTheme(settings);

  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.dataset.reducedMotion = settings.reducedMotion
      ? "true"
      : "false";
  }, [effectiveTheme, settings.reducedMotion]);

  const handleSettingsChange = useCallback((nextSettings: UserSettings) => {
    setSettings(nextSettings);
    saveSettings(nextSettings);
  }, []);

  return {
    settings,
    handleSettingsChange,
  };
};

const useProgressState = () => {
  const [progress, setProgress] = useState(() => loadProgress());
  const summary = useMemo(() => getProgressSummary(progress), [progress]);

  const handleProgressChange = useCallback(() => {
    setProgress(loadProgress());
  }, []);

  const handleDeleteProgress = useCallback(() => {
    resetProgress();
    setProgress(loadProgress());
  }, []);

  const handleDeleteDrafts = useCallback(() => clearAllDrafts(), []);

  const handleExportProgress = useCallback(() => {
    downloadProgressExport(progress);
  }, [progress]);

  const handleImportProgress = useCallback(async (file: File) => {
    try {
      const importedProgress = await readProgressExportFile(file);

      if (!replaceProgress(importedProgress)) {
        return {
          ok: false,
          message: "Progress import was valid, but this browser could not save it.",
        };
      }

      setProgress(importedProgress);

      return {
        ok: true,
        message: "Progress imported.",
      };
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Choose a valid Rust Daily progress export JSON file.",
      };
    }
  }, []);

  return {
    progress,
    summary,
    handleDeleteDrafts,
    handleDeleteProgress,
    handleExportProgress,
    handleImportProgress,
    handleProgressChange,
  };
};

const useLessonSelection = (route: AppRoute, progress: ReturnType<typeof loadProgress>) => {
  const dailyLesson = useMemo(
    () => selectDailyLesson(lessons, progress),
    [progress],
  );

  const activeLesson = useMemo(
    () =>
      route.kind === "lesson"
        ? lessons.find((lesson) => lesson.id === route.lessonId) ?? dailyLesson
        : null,
    [dailyLesson, route],
  );

  const activeConcept = useMemo(() => {
    return findConcept(activeLesson ?? dailyLesson);
  }, [activeLesson, dailyLesson]);

  return {
    activeConcept,
    activeLesson,
    dailyLesson,
  };
};

const useNavigationActions = (
  setRoute: (route: AppRoute) => void,
  dailyLessonId: string,
) => {
  const handleContinue = useCallback(() => {
    window.location.hash = lessonHash(dailyLessonId);
    setRoute({ kind: "lesson", lessonId: dailyLessonId });
  }, [dailyLessonId, setRoute]);

  const handleReturnHome = useCallback(() => {
    window.location.hash = "";
    setRoute({ kind: "home" });
  }, [setRoute]);

  const handleOpenSettings = useCallback(() => {
    window.location.hash = settingsHash;
    setRoute({ kind: "settings" });
  }, [setRoute]);

  return {
    handleContinue,
    handleOpenSettings,
    handleReturnHome,
  };
};

function App() {
  const [route, setRoute] = useAppRoute();
  const pwa = usePwaState();
  const { settings, handleSettingsChange } = useSettingsState();
  const progressState = useProgressState();
  const { activeConcept, activeLesson, dailyLesson } = useLessonSelection(
    route,
    progressState.progress,
  );
  const navigation = useNavigationActions(setRoute, dailyLesson.id);

  if (route.kind === "settings") {
    return (
      <>
        <PwaStatus
          isOffline={pwa.isOffline}
          isUpdating={pwa.isUpdating}
          updateAvailable={pwa.updateAvailable}
          onReloadUpdate={pwa.handleReloadUpdate}
        />
        <SettingsScreen
          settings={settings}
          summary={progressState.summary}
          onDeleteDrafts={progressState.handleDeleteDrafts}
          onDeleteProgress={progressState.handleDeleteProgress}
          onExportProgress={progressState.handleExportProgress}
          onImportProgress={progressState.handleImportProgress}
          onReturnHome={navigation.handleReturnHome}
          onSettingsChange={handleSettingsChange}
        />
      </>
    );
  }

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
          editorFontSize={settings.editorFontSize}
          lesson={activeLesson}
          onOpenSettings={navigation.handleOpenSettings}
          onProgressChange={progressState.handleProgressChange}
          onReturnHome={navigation.handleReturnHome}
          progress={progressState.progress}
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
        onContinue={navigation.handleContinue}
        onOpenSettings={navigation.handleOpenSettings}
        summary={progressState.summary}
      />
    </>
  );
}

export default App;
