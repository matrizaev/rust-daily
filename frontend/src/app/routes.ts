import type { InfoPageKind } from "../components/InfoScreen";
import type { LessonIndexEntry } from "../types/lesson";

export const HOME_PAGE_TITLE = "Rust Daily – 10-Minute Rust Practice Exercises";
export const settingsHash = "#settings";
export const lessonHash = (lessonId: string) => `#lesson/${lessonId}`;

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

export const getRouteFromHash = (lessons: LessonIndexEntry[]): AppRoute => {
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
