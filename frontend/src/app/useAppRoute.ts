import { useEffect, useState } from "react";
import { getInfoPageTitle } from "../components/InfoScreen";
import type { LessonIndexEntry } from "../types/lesson";
import {
  getRouteFromHash,
  HOME_PAGE_TITLE,
  type AppRoute,
} from "./routes";

const routeTitles = {
  settings: "Settings",
  lesson: "Lesson",
  playground: "Playground",
} as const;

const pageTitleForRoute = (route: AppRoute) => {
  if (route.kind === "home") {
    return HOME_PAGE_TITLE;
  }

  if (route.kind === "info") {
    return `${getInfoPageTitle(route.page)} | Rust Daily`;
  }

  return `${routeTitles[route.kind]} | Rust Daily`;
};

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
    document.title = pageTitleForRoute(route);
    window.scrollTo({ top: 0 });
  }, [route]);

  return [route, setRoute] as const;
};
