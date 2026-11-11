import { Suspense, lazy } from "react";
import { loadLessonScreen, loadSettingsScreen } from "./app/lazyScreens";
import { useAppRoute } from "./app/useAppRoute";
import { useLessonSelection } from "./app/useLessonSelection";
import { useNavigationActions } from "./app/useNavigationActions";
import { useProgressState } from "./app/useProgressState";
import { usePwaState } from "./app/usePwaState";
import { useSettingsState } from "./app/useSettingsState";
import {
  usePlaygroundLesson,
  type PlaygroundLessonState,
} from "./playground/usePlaygroundLesson";
import conceptsData from "./content/concepts.json";
import DailyHome from "./components/DailyHome";
import {
  InfoScreen,
  type InfoPageKind,
} from "./components/InfoScreen";
import PwaStatus from "./components/PwaStatus";
import { SiteFooter } from "./components/SiteFooter";
import {
  getLessonIndex,
} from "./content/lessonContent";
import {
  type UserSettings,
} from "./storage/settingsStore";
import type { Concept, Lesson, LessonIndexEntry } from "./types/lesson";
import type { AppRoute } from "./app/routes";

const LessonScreen = lazy(loadLessonScreen);
const SettingsScreen = lazy(loadSettingsScreen);

const lessons = [...getLessonIndex()].sort(
  (left, right) => left.order - right.order,
);
const concepts = conceptsData as Concept[];

const nextLessonId = (lessonId: string) => {
  const currentIndex = lessons.findIndex((lesson) => lesson.id === lessonId);

  return currentIndex < 0 ? null : lessons[currentIndex + 1]?.id ?? null;
};

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

const InfoRoute = ({
  navigation,
  page,
  pwa,
}: {
  navigation: NavigationActions;
  page: InfoPageKind;
  pwa: PwaState;
}) => (
  <>
    <PwaBanner pwa={pwa} />
    <InfoScreen page={page} onReturnHome={navigation.handleReturnHome} />
  </>
);

const getPlaygroundStatusCopy = (
  state: Exclude<PlaygroundLessonState, { kind: "ready" }>,
) => {
  if (state.kind === "loading") {
    return { title: "Opening Playground lesson", body: "Preparing the lesson workspace.", showReturnHome: false };
  }

  if (state.kind === "invalid") {
    return { title: "Lesson unavailable", body: state.message, showReturnHome: true };
  }

  return {
    title: "Opening Playground",
    body: "Preparing the scratch workspace.",
    showReturnHome: false,
  };
};

const PlaygroundStatusRoute = ({
  navigation,
  pwa,
  state,
}: {
  navigation: NavigationActions;
  pwa: PwaState;
  state: Exclude<PlaygroundLessonState, { kind: "ready" }>;
}) => {
  const { title, body, showReturnHome } = getPlaygroundStatusCopy(state);

  return (
    <>
      <PwaBanner pwa={pwa} />
      <main className="app-shell daily-shell">
        <section className="daily-overview" aria-live="polite">
          <p className="eyebrow">Playground</p>
          <h1>{title}</h1>
          <p>{body}</p>
          {showReturnHome ? (
            <button
              className="secondary-button"
              type="button"
              onClick={navigation.handleReturnHome}
            >
              Return home
            </button>
          ) : null}
        </section>
      </main>
    </>
  );
};

const LessonRoute = ({
  activeConcept,
  activeLesson,
  draftId,
  isPlayground = false,
  isScratch = false,
  navigation,
  progressState,
  pwa,
  settings,
}: {
  activeConcept: Concept | null;
  activeLesson: Lesson;
  draftId?: string;
  isPlayground?: boolean;
  isScratch?: boolean;
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
        nextLessonId={isPlayground ? null : nextLessonId(activeLesson.id)}
        isPlayground={isPlayground}
        isScratch={isScratch}
        draftId={draftId}
        onOpenLesson={navigation.handleOpenLesson}
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

const getInfoRoute = (
  route: AppRoute,
  navigation: NavigationActions,
  pwa: PwaState,
) => {
  if (route.kind !== "info") {
    return null;
  }

  return <InfoRoute navigation={navigation} page={route.page} pwa={pwa} />;
};

const PlaygroundRoute = ({
  navigation,
  playgroundLesson,
  progressState,
  pwa,
  settings,
}: {
  navigation: NavigationActions;
  playgroundLesson: PlaygroundLessonState;
  progressState: ProgressState;
  pwa: PwaState;
  settings: UserSettings;
}) => {
  if (playgroundLesson.kind !== "ready") {
    return (
      <PlaygroundStatusRoute
        navigation={navigation}
        pwa={pwa}
        state={playgroundLesson}
      />
    );
  }

  return (
    <LessonRoute
      activeConcept={null}
      activeLesson={playgroundLesson.lesson}
      draftId={playgroundLesson.draftId}
      isPlayground
      isScratch={playgroundLesson.isScratch}
      navigation={navigation}
      progressState={progressState}
      pwa={pwa}
      settings={settings}
    />
  );
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
  playgroundLesson,
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
  playgroundLesson: PlaygroundLessonState;
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
  const infoRoute = getInfoRoute(route, navigation, pwa);
  const routeCandidates = [
    {
      matches: infoRoute !== null,
      element: infoRoute,
    },
    {
      matches: route.kind === "playground",
      element: (
        <PlaygroundRoute
          navigation={navigation}
          playgroundLesson={playgroundLesson}
          progressState={progressState}
          pwa={pwa}
          settings={settings}
        />
      ),
    },
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
  const [route, setRoute] = useAppRoute(lessons);
  const playgroundLesson = usePlaygroundLesson(route);
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
    lessons,
    concepts,
  );
  const navigation = useNavigationActions(setRoute, dailyLesson.id);

  return (
    <>
      {progressState.storageError ? (
        <aside className="storage-warning" role="alert">
          Progress storage is {progressState.storageError}. Existing data was left untouched;
          use Settings to export, import, or reset it.
        </aside>
      ) : null}
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
        playgroundLesson={playgroundLesson}
        route={route}
        settings={settings}
      />
      <SiteFooter />
    </>
  );
}

export default App;
