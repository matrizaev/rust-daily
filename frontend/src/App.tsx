import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from "react";
import conceptsData from "./content/concepts.json";
import DailyHome from "./components/DailyHome";
import PwaStatus from "./components/PwaStatus";
import {
  getLessonById,
  getLessonIndex,
  loadLesson,
  mergeLesson,
  prefetchLessonDetail,
} from "./content/lessonContent";
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
import type { Concept, Lesson, LessonIndexEntry } from "./types/lesson";

const loadLessonScreen = () =>
  import("./components/LessonScreen").then(({ LessonScreen }) => ({
    default: LessonScreen,
  }));
const loadSettingsScreen = () =>
  import("./components/SettingsScreen").then(({ SettingsScreen }) => ({
    default: SettingsScreen,
  }));

const LessonScreen = lazy(loadLessonScreen);
const SettingsScreen = lazy(loadSettingsScreen);

const lessons = getLessonIndex();
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

const findConcept = (lesson: Lesson | LessonIndexEntry) =>
  concepts.find((concept) => concept.id === lesson.conceptId) ?? null;

const nextLessonId = (lessonId: string) => {
  const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);

  if (currentIndex < 0) {
    return null;
  }

  return lessons[currentIndex + 1]?.id ?? null;
};

const getIsOffline = () => !navigator.onLine;

type UpdateServiceWorker = () => Promise<void>;

const RouteLoadingScreen = ({
  title,
  body,
}: {
  title: string;
  body: string;
}) => (
  <main className="app-shell daily-shell">
    <section className="daily-overview" aria-live="polite">
      <p className="eyebrow">Loading</p>
      <h1>{title}</h1>
      <p>{body}</p>
    </section>
  </main>
);

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
    return findConcept(activeLesson ?? requestedLesson ?? dailyLesson);
  }, [activeLesson, dailyLesson, requestedLesson]);

  useEffect(() => {
    prefetchLessonDetail(dailyLesson.id);
    const upcomingLessonId = nextLessonId(dailyLesson.id);

    if (upcomingLessonId) {
      prefetchLessonDetail(upcomingLessonId);
    }
  }, [dailyLesson.id]);

  useEffect(() => {
    if (!activeLesson) {
      return;
    }

    const upcomingLessonId = nextLessonId(activeLesson.id);

    if (upcomingLessonId) {
      prefetchLessonDetail(upcomingLessonId);
    }
  }, [activeLesson]);

  return {
    activeConcept,
    activeLesson,
    dailyLesson,
    isLessonLoading,
    lessonLoadFailed,
  };
};

const useNavigationActions = (
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

type PwaState = ReturnType<typeof usePwaState>;
type ProgressState = ReturnType<typeof useProgressState>;
type NavigationActions = ReturnType<typeof useNavigationActions>;

const PwaBanner = ({ pwa }: { pwa: PwaState }) => (
  <PwaStatus
    isOffline={pwa.isOffline}
    isUpdating={pwa.isUpdating}
    updateAvailable={pwa.updateAvailable}
    onReloadUpdate={pwa.handleReloadUpdate}
  />
);

const SettingsRoute = ({
  handleSettingsChange,
  navigation,
  progressState,
  pwa,
  settings,
}: {
  handleSettingsChange: (settings: UserSettings) => void;
  navigation: NavigationActions;
  progressState: ProgressState;
  pwa: PwaState;
  settings: UserSettings;
}) => (
  <>
    <PwaBanner pwa={pwa} />
    <Suspense
      fallback={
        <RouteLoadingScreen
          title="Loading settings…"
          body="Preparing your local preferences and progress tools."
        />
      }
    >
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
    </Suspense>
  </>
);

const LessonStatusRoute = ({
  lessonLoadFailed,
  pwa,
}: {
  lessonLoadFailed: boolean;
  pwa: PwaState;
}) => (
  <>
    <PwaBanner pwa={pwa} />
    <RouteLoadingScreen
      title={lessonLoadFailed ? "Lesson unavailable" : "Loading lesson…"}
      body={
        lessonLoadFailed
          ? "This lesson could not be loaded right now. Try reconnecting, refreshing, or returning home."
          : "Fetching the lesson content, starter files, and validation steps."
      }
    />
  </>
);

const LessonRoute = ({
  activeConcept,
  activeLesson,
  navigation,
  progressState,
  pwa,
  settings,
}: {
  activeConcept: Concept | null;
  activeLesson: Lesson;
  navigation: NavigationActions;
  progressState: ProgressState;
  pwa: PwaState;
  settings: UserSettings;
}) => (
  <>
    <PwaBanner pwa={pwa} />
    <Suspense
      fallback={
        <RouteLoadingScreen
          title="Loading lesson…"
          body="Preparing the Rust editor and validation tools."
        />
      }
    >
      <LessonScreen
        concept={activeConcept}
        editorFontSize={settings.editorFontSize}
        lesson={activeLesson}
        onOpenSettings={navigation.handleOpenSettings}
        onProgressChange={progressState.handleProgressChange}
        onReturnHome={navigation.handleReturnHome}
        progress={progressState.progress}
      />
    </Suspense>
  </>
);

const HomeRoute = ({
  activeConcept,
  dailyLesson,
  navigation,
  progressState,
  pwa,
}: {
  activeConcept: Concept | null;
  dailyLesson: LessonIndexEntry;
  navigation: NavigationActions;
  progressState: ProgressState;
  pwa: PwaState;
}) => (
  <>
    <PwaBanner pwa={pwa} />
    <DailyHome
      concept={activeConcept}
      lesson={dailyLesson}
      lessons={lessons}
      onContinue={navigation.handleContinue}
      onOpenLesson={navigation.handleOpenLesson}
      onOpenSettings={navigation.handleOpenSettings}
      progress={progressState.progress}
      summary={progressState.summary}
    />
  </>
);

const isLessonStatusRoute = ({
  activeLesson,
  isLessonLoading,
  lessonLoadFailed,
  route,
}: {
  activeLesson: Lesson | null;
  isLessonLoading: boolean;
  lessonLoadFailed: boolean;
  route: AppRoute;
}) => {
  const lessonHasNoContent = activeLesson === null;
  const lessonIsPending = isLessonLoading || lessonLoadFailed || lessonHasNoContent;

  return route.kind === "lesson" && lessonIsPending;
};

const AppRouteView = ({
  activeConcept,
  activeLesson,
  dailyLesson,
  handleSettingsChange,
  isLessonLoading,
  lessonLoadFailed,
  navigation,
  progressState,
  pwa,
  route,
  settings,
}: {
  activeConcept: Concept | null;
  activeLesson: Lesson | null;
  dailyLesson: LessonIndexEntry;
  handleSettingsChange: (settings: UserSettings) => void;
  isLessonLoading: boolean;
  lessonLoadFailed: boolean;
  navigation: NavigationActions;
  progressState: ProgressState;
  pwa: PwaState;
  route: AppRoute;
  settings: UserSettings;
}) => {
  const lessonRoute = activeLesson ? (
    <LessonRoute
      activeConcept={activeConcept}
      activeLesson={activeLesson}
      navigation={navigation}
      progressState={progressState}
      pwa={pwa}
      settings={settings}
    />
  ) : null;
  const routeCandidates = [
    {
      matches: route.kind === "settings",
      element: (
        <SettingsRoute
          handleSettingsChange={handleSettingsChange}
          navigation={navigation}
          progressState={progressState}
          pwa={pwa}
          settings={settings}
        />
      ),
    },
    {
      matches: isLessonStatusRoute({
        activeLesson,
        isLessonLoading,
        lessonLoadFailed,
        route,
      }),
      element: (
        <LessonStatusRoute
          lessonLoadFailed={lessonLoadFailed}
          pwa={pwa}
        />
      ),
    },
    {
      matches: activeLesson !== null,
      element: lessonRoute,
    },
  ];

  return routeCandidates.find((candidate) => candidate.matches)?.element ?? (
    <HomeRoute
      activeConcept={activeConcept}
      dailyLesson={dailyLesson}
      navigation={navigation}
      progressState={progressState}
      pwa={pwa}
    />
  );
};

function App() {
  const [route, setRoute] = useAppRoute();
  const pwa = usePwaState();
  const { settings, handleSettingsChange } = useSettingsState();
  const progressState = useProgressState();
  const {
    activeConcept,
    activeLesson,
    dailyLesson,
    isLessonLoading,
    lessonLoadFailed,
  } = useLessonSelection(
    route,
    progressState.progress,
  );
  const navigation = useNavigationActions(setRoute, dailyLesson.id);

  return (
    <AppRouteView
      activeConcept={activeConcept}
      activeLesson={activeLesson}
      dailyLesson={dailyLesson}
      handleSettingsChange={handleSettingsChange}
      isLessonLoading={isLessonLoading}
      lessonLoadFailed={lessonLoadFailed}
      navigation={navigation}
      progressState={progressState}
      pwa={pwa}
      route={route}
      settings={settings}
    />
  );
}

export default App;
