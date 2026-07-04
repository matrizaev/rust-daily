import { isProgressStore } from "../progress/progressStore";
import type { ProgressStore } from "../types/progress";

const EXPORT_KIND = "rust-daily-progress-export";

type ProgressExport = {
  kind: typeof EXPORT_KIND;
  version: 1;
  exportedAt: string;
  progress: ProgressStore;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const createProgressExport = (
  progress: ProgressStore,
  now = new Date(),
): ProgressExport => ({
  kind: EXPORT_KIND,
  version: 1,
  exportedAt: now.toISOString(),
  progress,
});

const dateStamp = (now: Date) => now.toISOString().slice(0, 10);

const progressExportFileName = (now = new Date()) =>
  `rust-daily-progress-${dateStamp(now)}.json`;

export const downloadProgressExport = (
  progress: ProgressStore,
  now = new Date(),
) => {
  const payload = JSON.stringify(createProgressExport(progress, now), null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = progressExportFileName(now);
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
};

const getWrappedProgress = (value: Record<string, unknown>) =>
  value.kind === EXPORT_KIND && value.version === 1 ? value.progress : null;

const parseWrappedProgressPayload = (value: unknown) => {
  if (!isRecord(value)) {
    return null;
  }

  const progress = getWrappedProgress(value);

  return isProgressStore(progress) ? progress : null;
};

const parseProgressPayload = (value: unknown): ProgressStore | null =>
  isProgressStore(value) ? value : parseWrappedProgressPayload(value);

const parseProgressExportJson = (raw: string): ProgressStore | null => {
  try {
    return parseProgressPayload(JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
};

export const readProgressExportFile = async (file: File) => {
  const progress = parseProgressExportJson(await file.text());

  if (!progress) {
    throw new Error("Choose a valid Rust Daily progress export JSON file.");
  }

  return progress;
};
