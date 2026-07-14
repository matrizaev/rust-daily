import type { ProgressStore } from "../types/progress";
import { createProgressStore } from "./progressFactory";
import { isProgressStore } from "./progressValidation";

const PROGRESS_KEY = "rust-daily:v1:progress";
export const PROGRESS_STORAGE_EVENT = "rust-daily:progress-storage";

export type ProgressWriteResult =
  | { ok: true }
  | { ok: false; reason: "quota" | "unavailable" | "invalid" };

export type ProgressReadResult =
  | { ok: true; progress: ProgressStore }
  | { ok: false; reason: "unavailable" | "invalid"; progress: ProgressStore };

export const readProgress = (): ProgressReadResult => {
  let raw: string | null;

  try {
    raw = window.localStorage.getItem(PROGRESS_KEY);
  } catch {
    return { ok: false, reason: "unavailable", progress: createProgressStore() };
  }

  if (!raw) {
    return { ok: true, progress: createProgressStore() };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;

    return isProgressStore(parsed)
      ? { ok: true, progress: parsed }
      : { ok: false, reason: "invalid", progress: createProgressStore() };
  } catch {
    return { ok: false, reason: "invalid", progress: createProgressStore() };
  }
};

export const loadProgress = () => readProgress().progress;

const notifyProgressStorage = (result: ProgressWriteResult) => {
  window.dispatchEvent(new CustomEvent(PROGRESS_STORAGE_EVENT, { detail: result }));

  return result;
};

const saveProgress = (progress: ProgressStore): ProgressWriteResult => {
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));

    return notifyProgressStorage({ ok: true });
  } catch (error) {
    return notifyProgressStorage({
      ok: false,
      reason: error instanceof DOMException && error.name === "QuotaExceededError"
        ? "quota"
        : "unavailable",
    });
  }
};

export const replaceProgress = (progress: ProgressStore) =>
  saveProgress(progress);

export const resetProgress = () => {
  try {
    window.localStorage.removeItem(PROGRESS_KEY);

    return notifyProgressStorage({ ok: true });
  } catch {
    return notifyProgressStorage({ ok: false, reason: "unavailable" });
  }
};

export const updateProgress = (
  update: (progress: ProgressStore) => ProgressStore,
) => {
  const current = readProgress();

  if (!current.ok) {
    return {
      ...notifyProgressStorage({ ok: false, reason: current.reason }),
      progress: current.progress,
    };
  }

  const next = update(current.progress);
  const result = saveProgress(next);

  return { ...result, progress: next };
};
