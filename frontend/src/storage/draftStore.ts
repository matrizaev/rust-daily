export type DraftRecord = {
  lessonId: string;
  code: string;
  files: Record<string, string>;
  updatedAt: string;
};

export type DraftWriteResult =
  | { ok: true; record: DraftRecord | null }
  | { ok: false; reason: "unavailable" | "quota" };

export type DraftReadResult =
  | { ok: true; record: DraftRecord | null }
  | { ok: false; reason: "unavailable" | "invalid" };

const PREFIX = "rust-daily:v1:draft";

const getDraftKey = (lessonId: string) => `${PREFIX}:${lessonId}`;

type DraftCandidate = {
  lessonId: string;
  code?: unknown;
  files?: unknown;
  updatedAt?: unknown;
};

const hasStringFileMap = (files: unknown) =>
  files !== null &&
  typeof files === "object" &&
  Object.values(files).every((value) => typeof value === "string");

const isObject = (record: unknown): record is object =>
  typeof record === "object" && record !== null;

const hasDraftContent = (candidate: Partial<DraftRecord>) =>
  typeof candidate.code === "string" || hasStringFileMap(candidate.files);

const isDraftCandidate = (
  record: unknown,
  lessonId: string,
): record is DraftCandidate => {
  if (!isObject(record)) {
    return false;
  }
  const candidate = record as Partial<DraftRecord>;

  return candidate.lessonId === lessonId && hasDraftContent(candidate);
};

const normalizeFiles = (record: DraftCandidate) => {
  if (record.files && typeof record.files === "object") {
    return record.files as Record<string, string>;
  }

  return {
    "src/lib.rs": typeof record.code === "string" ? record.code : "",
  };
};

const normalizeDraft = (record: DraftCandidate): DraftRecord => {
  const files = normalizeFiles(record);

  return {
    lessonId: record.lessonId,
    code: files["src/lib.rs"] ?? Object.values(files)[0] ?? "",
    files,
    updatedAt:
      typeof record.updatedAt === "string"
        ? record.updatedAt
        : new Date().toISOString(),
  };
};

const parseDraft = (raw: string, lessonId: string): DraftRecord | null => {
  const record = JSON.parse(raw) as unknown;

  return isDraftCandidate(record, lessonId) ? normalizeDraft(record) : null;
};

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

export const loadDraft = (lessonId: string): DraftRecord | null => {
  const result = readDraft(lessonId);
  return result.ok ? result.record : null;
};

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

export const clearDraft = (lessonId: string) => {
  try {
    window.localStorage.removeItem(getDraftKey(lessonId));
    return { ok: true } as const;
  } catch {
    return { ok: false, reason: "unavailable" } as const;
  }
};

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
