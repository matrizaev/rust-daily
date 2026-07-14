import { useCallback, useMemo, useState } from "react";
import { getProgressSummary } from "../progress/progressSelectors";
import {
  loadProgress,
  readProgress,
  replaceProgress,
  resetProgress,
  type ProgressReadResult,
} from "../progress/progressStore";
import { clearAllDrafts } from "../storage/draftStore";
import {
  downloadProgressExport,
  readProgressExportFile,
} from "../storage/progressPortability";

export const useProgressState = () => {
  const initialProgress = useMemo<ProgressReadResult>(() => readProgress(), []);
  const [progress, setProgress] = useState(initialProgress.progress);
  const [storageError, setStorageError] = useState<string | null>(
    initialProgress.ok ? null : initialProgress.reason,
  );
  const summary = useMemo(() => getProgressSummary(progress), [progress]);

  const handleProgressChange = useCallback(() => {
    const result = readProgress();

    setProgress(result.progress);
    setStorageError(result.ok ? null : result.reason);
  }, []);

  const handleDeleteProgress = useCallback(() => {
    const result = resetProgress();

    if (result.ok) {
      setProgress(loadProgress());
      setStorageError(null);
    }

    return result.ok;
  }, []);

  const handleDeleteDrafts = useCallback(() => clearAllDrafts(), []);

  const handleExportProgress = useCallback(() => {
    downloadProgressExport(progress);
  }, [progress]);

  const handleImportProgress = useCallback(async (file: File) => {
    try {
      const importedProgress = await readProgressExportFile(file);

      if (!replaceProgress(importedProgress).ok) {
        return {
          ok: false,
          message: "Progress import was valid, but this browser could not save it.",
        };
      }

      setProgress(importedProgress);
      setStorageError(null);

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
    storageError,
    summary,
    handleDeleteDrafts,
    handleDeleteProgress,
    handleExportProgress,
    handleImportProgress,
    handleProgressChange,
  };
};
