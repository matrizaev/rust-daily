import type { ProgressStore } from "../types/progress";
import { nowIso } from "./progressPrimitives";

export const createProgressStore = (now = new Date()): ProgressStore => {
  const timestamp = nowIso(now);

  return {
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    attempts: [],
    completions: [],
    concepts: {},
  };
};
