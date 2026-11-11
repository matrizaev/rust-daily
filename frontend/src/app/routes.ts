import type { InfoPageKind } from "../components/InfoScreen";
import type { LessonIndexEntry } from "../types/lesson";

export const HOME_PAGE_TITLE = "Rust Daily – 10-Minute Rust Practice Exercises";
export const settingsHash = "#settings";
export const lessonHash = (lessonId: string) => `#lesson/${lessonId}`;
const playgroundHash = "#playground";

export type AppRoute =
  | {
    kind: "home";
  }
  | {
    kind: "settings";
  }
  | {
    kind: "lesson";
    lessonId: string;
  }
  | {
    kind: "playground";
    encodedLesson: string | null;
    payloadError: string | null;
  }
  | {
    kind: "info";
    page: InfoPageKind;
  };

const staticRoutes = new Map<string, AppRoute>([
  [settingsHash, { kind: "settings" }],
  ["#about", { kind: "info", page: "about" }],
  ["#contact", { kind: "info", page: "contact" }],
  ["#privacy", { kind: "info", page: "privacy" }],
  ["#terms", { kind: "info", page: "terms" }],
]);

const getLessonIdFromHash = () => {
  const hash = window.location.hash;

  return hash.startsWith("#lesson/") ? hash.replace("#lesson/", "") : null;
};

const getPlaygroundRoute = (hash: string): AppRoute | null => {
  if (hash === playgroundHash) {
    return { kind: "playground", encodedLesson: null, payloadError: null };
  }

  if (!hash.startsWith(`${playgroundHash}?`)) {
    return null;
  }

  const params = new URLSearchParams(hash.slice(`${playgroundHash}?`.length));
  const lessonValues = params.getAll("lesson");
  const hasOnlyLessonParameter = [...params.keys()].length === 1;

  if (!hasOnlyLessonParameter || lessonValues.length !== 1 || !lessonValues[0]) {
    return {
      kind: "playground",
      encodedLesson: null,
      payloadError: "This Playground link must contain exactly one lesson payload.",
    };
  }

  return {
    kind: "playground",
    encodedLesson: lessonValues[0],
    payloadError: null,
  };
};

export const getRouteFromHash = (lessons: LessonIndexEntry[]): AppRoute => {
  const playgroundRoute = getPlaygroundRoute(window.location.hash);

  if (playgroundRoute) {
    return playgroundRoute;
  }

  const staticRoute = staticRoutes.get(window.location.hash);

  if (staticRoute) {
    return staticRoute;
  }

  const lessonId = getLessonIdFromHash();

  if (lessonId && lessons.some((lesson) => lesson.id === lessonId)) {
    return { kind: "lesson", lessonId };
  }

  return { kind: "home" };
};
