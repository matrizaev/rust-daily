import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearDraft,
  readDraft,
  saveDraft,
  type DraftRecord,
} from "../../storage/draftStore";
import type { Lesson } from "../../types/lesson";

const SAVE_DELAY_MS = 450;
const DEFAULT_EDITABLE_PATH = "src/lib.rs";

type DraftState = {
  code: string;
  filePath: string;
  lastSavedAt: string | null;
  saveError: string | null;
};

const getPrimaryEditableFile = (lesson: Lesson) =>
  lesson.files.find((file) => file.role === "editable") ?? {
    path: DEFAULT_EDITABLE_PATH,
    role: "editable" as const,
    content: lesson.starterCode,
  };

const getStarterDraftState = (lesson: Lesson): DraftState => ({
  code: getPrimaryEditableFile(lesson).content,
  filePath: getPrimaryEditableFile(lesson).path,
  lastSavedAt: null,
  saveError: null,
});

const draftRecordToState = (lesson: Lesson, draft: DraftRecord): DraftState => {
  const editableFile = getPrimaryEditableFile(lesson);
  const legacyCode =
    editableFile.path === DEFAULT_EDITABLE_PATH ? draft.code : editableFile.content;

  return {
    code: draft.files[editableFile.path] ?? legacyCode,
    filePath: editableFile.path,
    lastSavedAt: draft.updatedAt,
    saveError: null,
  };
};

const getDraftState = (lesson: Lesson): DraftState => {
  const result = readDraft(lesson.id);

  if (!result.ok) {
    return {
      ...getStarterDraftState(lesson),
      saveError: result.reason,
    };
  }

  return result.record === null
    ? getStarterDraftState(lesson)
    : draftRecordToState(lesson, result.record);
};

const formatSavedAt = (savedAt: string | null, saveError: string | null) =>
  saveError
    ? `Draft not saved locally: ${saveError}.`
    :
  savedAt
    ? `Draft saved ${new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(savedAt))}`
    : "Draft will save locally";

const draftPersistenceState = (
  result: { ok: true; record?: DraftRecord | null } | { ok: false; reason: string },
) => result.ok
  ? { savedAt: result.record?.updatedAt ?? null, error: null }
  : { savedAt: null, error: result.reason };

const clearStarterDraft = (lessonId: string) =>
  draftPersistenceState(clearDraft(lessonId));

const saveChangedDraft = (lessonId: string, filePath: string, code: string) =>
  draftPersistenceState(saveDraft(lessonId, code, filePath));

const persistDraft = (lesson: Lesson, filePath: string, code: string) => {
  if (code === getPrimaryEditableFile(lesson).content) {
    return clearStarterDraft(lesson.id);
  }

  return saveChangedDraft(lesson.id, filePath, code);
};

export const useLessonDraft = (lesson: Lesson) => {
  const initialDraft = useMemo(() => getDraftState(lesson), [lesson]);

  const [code, setCode] = useState(initialDraft.code);
  const [filePath, setFilePath] = useState(initialDraft.filePath);
  const [revealedHints, setRevealedHints] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(initialDraft.lastSavedAt);
  const [saveError, setSaveError] = useState<string | null>(initialDraft.saveError);

  useEffect(() => {
    const nextDraft = getDraftState(lesson);

    setCode(nextDraft.code);
    setFilePath(nextDraft.filePath);
    setLastSavedAt(nextDraft.lastSavedAt);
    setSaveError(nextDraft.saveError);
    setRevealedHints(0);
  }, [lesson]);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      const result = persistDraft(lesson, filePath, code);

      setLastSavedAt(result.savedAt);
      setSaveError(result.error);
    }, SAVE_DELAY_MS);

    return () => window.clearTimeout(saveTimer);
  }, [code, filePath, lesson]);

  const handleReset = useCallback(() => {
    const editableFile = getPrimaryEditableFile(lesson);
    const result = clearDraft(lesson.id);

    setCode(editableFile.content);
    setFilePath(editableFile.path);
    setLastSavedAt(null);
    setSaveError(result.ok ? null : result.reason);
    setRevealedHints(0);
  }, [lesson]);

  const handleRevealHint = useCallback(() => {
    setRevealedHints((current) => Math.min(current + 1, lesson.hints.length));
  }, [lesson.hints.length]);

  return {
    code,
    filePath,
    revealedHints,
    saveStatus: formatSavedAt(lastSavedAt, saveError),
    setCode,
    handleReset,
    handleRevealHint,
  };
};
