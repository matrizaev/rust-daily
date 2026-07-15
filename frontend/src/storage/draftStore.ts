/** Saved editable lesson draft. */
export type DraftRecord = {
  lessonId: string;
  code: string;
  files: Record<string, string>;
  updatedAt: string;
};

/** Result of writing draft state to browser storage. */
export type DraftWriteResult =
  | { ok: true; record: DraftRecord | null }
  | { ok: false; reason: "unavailable" | "quota" };

/** Result of reading draft state from browser storage. */
export type DraftReadResult =
  | { ok: true; record: DraftRecord | null }
  | { ok: false; reason: "unavailable" | "invalid" };

const PREFIX = "rust-daily:v1:draft";

const getDraftKey = (lessonId: string) => `${PREFIX}:${lessonId}`;

const isStringFileMap = (files: unknown): files is Record<string, string> =>
  files !== null &&
  typeof files === "object" &&
  Object.values(files).every((value) => typeof value === "string");

const isObject = (record: unknown): record is object =>
  typeof record === "object" && record !== null;

const isDraftRecord = (
  record: unknown,
  lessonId: string,
): record is DraftRecord => {
  if (!isObject(record)) {
    return false;
  }
  const candidate = record as Partial<DraftRecord>;

  return (
    candidate.lessonId === lessonId &&
    typeof candidate.code === "string" &&
    isStringFileMap(candidate.files) &&
    typeof candidate.updatedAt === "string"
  );
};

const parseDraft = (raw: string, lessonId: string): DraftRecord | null => {
  const record = JSON.parse(raw) as unknown;

  return isDraftRecord(record, lessonId) ? record : null;
};

/** Reads and validates the saved draft for one lesson. */
export const readDraft = (lessonId: string): DraftReadResult => {
  try {
    const raw = window.localStorage.getItem(getDraftKey(lessonId));
    if (!raw) {
      return { ok: true, record: null };
    }
    const record = parseDraft(raw, lessonId);
    return record ? { ok: true, record } : { ok: false, reason: "invalid" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
};

/** Saves the current editable file as the lesson draft. */
export const saveDraft = (
  lessonId: string,
  code: string,
  path = "src/lib.rs",
): DraftWriteResult => {
  const files = {
    [path]: code,
  };
  const record: DraftRecord = {
    lessonId,
    code: files["src/lib.rs"] ?? code,
    files,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(getDraftKey(lessonId), JSON.stringify(record));
    return { ok: true, record };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof DOMException && error.name === "QuotaExceededError"
        ? "quota"
        : "unavailable",
    };
  }
};

/** Removes the saved draft for one lesson. */
export const clearDraft = (lessonId: string) => {
  try {
    window.localStorage.removeItem(getDraftKey(lessonId));
    return { ok: true } as const;
  } catch {
    return { ok: false, reason: "unavailable" } as const;
  }
};

/** Removes all Rust Daily draft records from browser storage. */
export const clearAllDrafts = () => {
  try {
    const draftKeys = Object.keys(window.localStorage).filter((key) =>
      key.startsWith(`${PREFIX}:`),
    );

    draftKeys.forEach((key) => window.localStorage.removeItem(key));

    return draftKeys.length;
  } catch {
    return 0;
  }
};
