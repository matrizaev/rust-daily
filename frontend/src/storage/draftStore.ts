export type DraftRecord = {
  lessonId: string;
  code: string;
  files: Record<string, string>;
  updatedAt: string;
};

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

// fallow-ignore-next-line complexity
const isDraftCandidate = (
  record: unknown,
  lessonId: string,
): record is DraftCandidate => {
  if (!record || typeof record !== "object") {
    return false;
  }

  const candidate = record as Partial<DraftRecord>;
  const hasDraftContent =
    typeof candidate.code === "string" || hasStringFileMap(candidate.files);

  return candidate.lessonId === lessonId && hasDraftContent;
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

export const loadDraft = (lessonId: string): DraftRecord | null => {
  try {
    const raw = window.localStorage.getItem(getDraftKey(lessonId));

    return raw ? parseDraft(raw, lessonId) : null;
  } catch {
    return null;
  }
};

export const saveDraft = (
  lessonId: string,
  code: string,
  path = "src/lib.rs",
): DraftRecord | null => {
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
