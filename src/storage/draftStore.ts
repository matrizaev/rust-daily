export type DraftRecord = {
  lessonId: string;
  code: string;
  updatedAt: string;
};

const PREFIX = "rust-daily:v1:draft";

const getDraftKey = (lessonId: string) => `${PREFIX}:${lessonId}`;

type DraftCandidate = {
  lessonId: string;
  code: string;
  updatedAt?: unknown;
};

const isDraftCandidate = (
  record: unknown,
  lessonId: string,
): record is DraftCandidate => {
  if (!record || typeof record !== "object") {
    return false;
  }

  const candidate = record as Partial<DraftRecord>;

  return candidate.lessonId === lessonId && typeof candidate.code === "string";
};

const normalizeDraft = (record: DraftCandidate): DraftRecord => ({
  lessonId: record.lessonId,
  code: record.code,
  updatedAt:
    typeof record.updatedAt === "string"
      ? record.updatedAt
      : new Date().toISOString(),
});

const parseDraft = (raw: string, lessonId: string): DraftRecord | null => {
  const record = JSON.parse(raw) as unknown;

  return isDraftCandidate(record, lessonId) ? normalizeDraft(record) : null;
};

export const loadDraft = (lessonId: string): DraftRecord | null => {
  try {
    const raw = window.localStorage.getItem(getDraftKey(lessonId));

    return raw ? parseDraft(raw, lessonId) : null;
  } catch {
    return null;
  }
};

export const saveDraft = (lessonId: string, code: string): DraftRecord | null => {
  const record: DraftRecord = {
    lessonId,
    code,
    updatedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(getDraftKey(lessonId), JSON.stringify(record));
    return record;
  } catch {
    return null;
  }
};

export const clearDraft = (lessonId: string) => {
  try {
    window.localStorage.removeItem(getDraftKey(lessonId));
  } catch {
    // LocalStorage can be unavailable in restricted browser modes.
  }
};
