import { useEffect, useState } from "react";
import { getInfoPageTitle } from "../components/InfoScreen";
import type { LessonIndexEntry } from "../types/lesson";
import {
  getRouteFromHash,
  HOME_PAGE_TITLE,
  type AppRoute,
} from "./routes";

export const useAppRoute = (lessons: LessonIndexEntry[]) => {
  const [route, setRoute] = useState<AppRoute>(() => getRouteFromHash(lessons));

  useEffect(() => {
    const handleHashChange = () => {
      setRoute(getRouteFromHash(lessons));
    };

    window.addEventListener("hashchange", handleHashChange);

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [lessons]);

  useEffect(() => {
    document.title =
      route.kind === "info"
        ? `${getInfoPageTitle(route.page)} | Rust Daily`
        : route.kind === "settings"
          ? "Settings | Rust Daily"
          : route.kind === "lesson"
            ? "Lesson | Rust Daily"
            : HOME_PAGE_TITLE;
    window.scrollTo({ top: 0 });
  }, [route]);

  return [route, setRoute] as const;
};
