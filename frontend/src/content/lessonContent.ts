import lessonIndexData from "./lessonIndex.json";
import contentRevisionData from "./contentRevision.json";
import type {
  Lesson,
  LessonDetail,
  LessonDetailResponse,
  LessonFile,
  LessonHint,
  LessonIndexEntry,
} from "../types/lesson";
import type { LessonValidation, LessonValidationStep } from "../types/validation";
import { normalizeLessonIndex } from "./normalizeLessons";

const lessonIndex = normalizeLessonIndex(
  lessonIndexData as LessonIndexEntry[],
) as LessonIndexEntry[];
const lessonDetailCache = new Map<string, LessonDetail>();
const CONTENT_REVISION = contentRevisionData.revision;

const lessonDetailUrl = (lessonId: string) =>
  `${import.meta.env.BASE_URL}content/lessons/${encodeURIComponent(lessonId)}.json?v=${CONTENT_REVISION}`;

const mergeLessonDetail = (
  lesson: LessonIndexEntry,
  detail: LessonDetail,
): Lesson => ({
  ...lesson,
  instructions: detail.instructions,
  files: detail.files,
  hints: detail.hints,
  completionExplanation: detail.completionExplanation,
  validation: detail.validation,
  starterCode: detail.starterCode,
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const hasExactFields = (
  value: Record<string, unknown>,
  required: string[],
  optional: string[] = [],
) => {
  const keys = Object.keys(value);
  const allowed = new Set([...required, ...optional]);
  return required.every((field) => Object.hasOwn(value, field)) &&
    keys.every((field) => allowed.has(field));
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isPositiveInteger = (value: unknown) =>
  typeof value === "number" && Number.isInteger(value) && value > 0;

const isSafeRelativePath = (value: string) => {
  const components = value.split("/");
  return value.length > 0 &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(value) &&
    components.every((component) => component.length > 0 && component !== "." && component !== "..") &&
    new TextEncoder().encode(value).byteLength <= 240 &&
    components.every((component) => new TextEncoder().encode(component).byteLength <= 120);
};

const isLessonFile = (value: unknown): value is LessonFile =>
  isRecord(value) &&
  hasExactFields(value, ["path", "role", "content"]) &&
  typeof value.path === "string" &&
  isSafeRelativePath(value.path) &&
  typeof value.content === "string" &&
  (value.role === "editable" || value.role === "readonly" || value.role === "test");

const isLessonHint = (value: unknown): value is LessonHint =>
  isRecord(value) &&
  hasExactFields(value, ["level", "body"], ["solutionCode"]) &&
  typeof value.level === "number" &&
  Number.isInteger(value.level) &&
  value.level > 0 &&
  typeof value.body === "string" &&
  (value.solutionCode === undefined || typeof value.solutionCode === "string");

const STRUCTURAL_CHECK_FIELDS: Record<string, { strings?: string[]; arrays?: string[] }> = {
  enum_unit_variants: { strings: ["enumName"], arrays: ["requiredVariants"] },
  struct_fields: { strings: ["structName"] },
  tuple_struct_fields: { strings: ["structName"], arrays: ["requiredTypes"] },
  impl_trait_for_type: { strings: ["traitName", "typeName"] },
  derived_trait_for_type: { strings: ["traitName", "typeName"] },
  impl_method: { strings: ["implFor", "methodName"], arrays: ["requiredSignatureIncludes"] },
  function_signature: { strings: ["functionName"], arrays: ["requiredSignatureIncludes"] },
  source_includes: { arrays: ["requiredSnippets", "forbiddenSnippets"] },
};

const isStructField = (value: unknown) =>
  isRecord(value) &&
  hasExactFields(value, ["name", "typeIncludes"]) &&
  typeof value.name === "string" &&
  isStringArray(value.typeIncludes);

const isStructFieldsCheck = (value: Record<string, unknown>) =>
  hasExactFields(value, ["type", "structName", "requiredFields"]) &&
  typeof value.structName === "string" &&
  Array.isArray(value.requiredFields) &&
  value.requiredFields.every(isStructField);

const matchesStructuralShape = (
  value: Record<string, unknown>,
  shape: { strings?: string[]; arrays?: string[] },
) => {
  const strings = shape.strings ?? [];
  const arrays = shape.arrays ?? [];
  const requiredArrays = arrays.filter((field) => field !== "forbiddenSnippets");
  const optional = arrays.length === requiredArrays.length ? [] : ["forbiddenSnippets"];
  return hasExactFields(value, ["type", ...strings, ...requiredArrays], optional) &&
    strings.every((field) => typeof value[field] === "string") &&
    arrays.every((field) => value[field] === undefined || isStringArray(value[field]));
};

const isStructuralCheck = (value: unknown) => {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }
  const shape = STRUCTURAL_CHECK_FIELDS[value.type];
  if (!shape) {
    return false;
  }
  return value.type === "struct_fields"
    ? isStructFieldsCheck(value)
    : matchesStructuralShape(value, shape);
};

const isDependencySet = (value: unknown) => value === "std" || value === "advanced";

const isRuntimeFile = (value: unknown) =>
  isRecord(value) &&
  hasExactFields(value, ["path", "content"]) &&
  typeof value.path === "string" &&
  isSafeRelativePath(value.path) &&
  typeof value.content === "string";

const isCompileFailCase = (value: unknown) =>
  isRecord(value) &&
  hasExactFields(
    value,
    ["name", "path", "content", "expectedDiagnostics"],
    ["forbiddenDiagnostics"],
  ) &&
  typeof value.name === "string" &&
  typeof value.path === "string" &&
  isSafeRelativePath(value.path) &&
  typeof value.content === "string" &&
  isStringArray(value.expectedDiagnostics) &&
  (value.forbiddenDiagnostics === undefined || isStringArray(value.forbiddenDiagnostics));

const isOptional = (value: unknown, predicate: (item: unknown) => boolean) =>
  value === undefined || predicate(value);

const VALIDATION_STEP_DECODERS: Record<string, (value: Record<string, unknown>) => boolean> = {
  "self-check": (value) => hasExactFields(value, ["mode"]),
  structural: (value) =>
    hasExactFields(value, ["mode", "timeoutMs", "checks"]) &&
    isPositiveInteger(value.timeoutMs) &&
    Array.isArray(value.checks) &&
    value.checks.every(isStructuralCheck),
  "browser-rust": (value) =>
    hasExactFields(value, ["mode", "timeoutMs", "checks"]) &&
    isPositiveInteger(value.timeoutMs) &&
    Array.isArray(value.checks),
  "backend-cargo-test": (value) =>
    hasExactFields(value, ["mode", "timeoutMs"], ["testCode", "dependencySet", "testFiles"]) &&
    isPositiveInteger(value.timeoutMs) &&
    isOptional(value.testCode, (item) => typeof item === "string") &&
    isOptional(value.dependencySet, isDependencySet) &&
    isOptional(value.testFiles, (item) => Array.isArray(item) && item.every(isRuntimeFile)),
  "backend-compile-fail": (value) =>
    hasExactFields(value, ["mode", "timeoutMs", "cases"], ["dependencySet"]) &&
    isPositiveInteger(value.timeoutMs) &&
    isOptional(value.dependencySet, isDependencySet) &&
    Array.isArray(value.cases) &&
    value.cases.every(isCompileFailCase),
};

const isLessonValidationStep = (value: unknown): value is LessonValidationStep => {
  if (!isRecord(value) || typeof value.mode !== "string") {
    return false;
  }
  return VALIDATION_STEP_DECODERS[value.mode]?.(value) ?? false;
};

const isLessonValidation = (value: unknown): value is LessonValidation =>
  isLessonValidationStep(value) ||
  isRecord(value) &&
    value.mode === "all" &&
    hasExactFields(value, ["mode", "validations"]) &&
    Array.isArray(value.validations) &&
    value.validations.every(isLessonValidationStep);

const hasValidDetailIdentity = (
  value: unknown,
  requestedId: string,
  schemaVersion: LessonIndexEntry["schemaVersion"],
): value is Record<string, unknown> => isRecord(value) &&
  hasExactFields(value, ["id", "schemaVersion", "detail"]) &&
  value.id === requestedId &&
  value.schemaVersion === schemaVersion;

const hasValidDetailSchema = (detail: unknown): detail is LessonDetail => {
  if (!isRecord(detail) || !hasExactFields(
    detail,
    ["instructions", "starterCode", "files", "hints", "completionExplanation"],
    ["validation"],
  )) {
    return false;
  }
  const validators = [
    typeof detail.instructions === "string",
    typeof detail.starterCode === "string",
    Array.isArray(detail.files) && detail.files.every(isLessonFile),
    Array.isArray(detail.hints) && detail.hints.every(isLessonHint),
    typeof detail.completionExplanation === "string",
    isOptional(detail.validation, isLessonValidation),
  ];
  return validators.every(Boolean);
};

const hasValidDetailInvariants = (detail: LessonDetail) => {
  const editableFiles = detail.files.filter((file) => file.role === "editable");
  return new Set(detail.files.map((file) => file.path)).size === detail.files.length &&
    editableFiles.length === 1 &&
    editableFiles[0].content === detail.starterCode &&
    detail.hints.every((hint, index) => hint.level === index + 1);
};

const decodeLessonDetail = (
  value: unknown,
  requestedId: string,
  schemaVersion: LessonIndexEntry["schemaVersion"],
): LessonDetail => {
  if (!hasValidDetailIdentity(value, requestedId, schemaVersion)) {
    throw new Error(`Invalid lesson detail identity for ${requestedId}.`);
  }
  const detail = value.detail;
  if (!hasValidDetailSchema(detail)) {
    throw new Error(`Invalid lesson detail schema for ${requestedId}.`);
  }
  if (!hasValidDetailInvariants(detail)) {
    throw new Error(`Invalid lesson detail invariants for ${requestedId}.`);
  }
  return detail;
};

export const getLessonById = (lessonId: string) =>
  lessonIndex.find((lesson) => lesson.id === lessonId) ?? null;

export const getLessonIndex = () => lessonIndex;

export const mergeLesson = (
  lesson: LessonIndexEntry,
  detail: LessonDetail,
) => mergeLessonDetail(lesson, detail);

const loadLessonDetail = async (lessonId: string) => {
  const cached = lessonDetailCache.get(lessonId);

  if (cached) {
    return cached;
  }

  const response = await fetch(lessonDetailUrl(lessonId), {
    credentials: "same-origin",
  });

  if (!response.ok) {
    throw new Error(`Failed to load lesson detail for ${lessonId}.`);
  }

  const detail = decodeLessonDetail(
    await response.json() as LessonDetailResponse,
    lessonId,
    getLessonById(lessonId)?.schemaVersion ?? 2,
  );
  lessonDetailCache.set(lessonId, detail);

  return detail;
};

export const loadLesson = async (lessonId: string) => {
  const lesson = getLessonById(lessonId);

  if (!lesson) {
    return null;
  }

  return mergeLessonDetail(lesson, await loadLessonDetail(lessonId));
};

export const prefetchLessonDetail = (lessonId: string) => {
  if (lessonDetailCache.has(lessonId)) {
    return;
  }

  void loadLessonDetail(lessonId).catch(() => undefined);
};
