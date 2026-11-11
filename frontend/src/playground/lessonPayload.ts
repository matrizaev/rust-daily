import type { Lesson } from "../types/lesson";
import type { LessonValidation } from "../types/validation";

const MAX_PAYLOAD_BYTES = 32 * 1024;
const MAX_ENCODED_LENGTH = Math.ceil(MAX_PAYLOAD_BYTES * 4 / 3);
const VALIDATION_MODES = new Set([
    "all",
    "structural",
    "browser-rust",
    "backend-cargo-test",
    "backend-compile-fail",
    "self-check",
]);

export type PlaygroundLessonResult =
    | { ok: true; lesson: Lesson; canonicalJson: string }
    | { ok: false; message: string };

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
    typeof value === "string" && value.trim().length > 0;

const isSafeRelativePath = (value: unknown): value is string =>
    typeof value === "string" &&
    value.length > 0 &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(value) &&
    value.split("/").every((part) => part !== "" && part !== "." && part !== "..");

const isSupportedProjectPath = (path: string) =>
    ((path.startsWith("src/") || path.startsWith("tests/")) && path.endsWith(".rs")) ||
    path.startsWith("fixtures/") ||
    path.startsWith("testdata/");

const isPositiveTimeout = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) && value > 0;

const isStringArray = (items: unknown): items is string[] =>
    Array.isArray(items) && items.every((item) => typeof item === "string");

const isStructuralField = (field: unknown) =>
    isRecord(field) && typeof field.name === "string" && isStringArray(field.typeIncludes);

type StructuralCheckValidator = (value: Record<string, unknown>) => boolean;

const structuralCheckValidators: Partial<Record<string, StructuralCheckValidator>> = {
    enum_unit_variants: (check) =>
        typeof check.enumName === "string" && isStringArray(check.requiredVariants),
    struct_fields: (check) =>
        typeof check.structName === "string" &&
        Array.isArray(check.requiredFields) &&
        check.requiredFields.every(isStructuralField),
    tuple_struct_fields: (check) =>
        typeof check.structName === "string" && isStringArray(check.requiredTypes),
    impl_trait_for_type: (check) =>
        typeof check.traitName === "string" && typeof check.typeName === "string",
    derived_trait_for_type: (check) =>
        typeof check.traitName === "string" && typeof check.typeName === "string",
    impl_method: (check) =>
        typeof check.implFor === "string" &&
        typeof check.methodName === "string" &&
        isStringArray(check.requiredSignatureIncludes),
    function_signature: (check) =>
        typeof check.functionName === "string" &&
        isStringArray(check.requiredSignatureIncludes),
    source_includes: (check) =>
        isStringArray(check.requiredSnippets) &&
        (check.forbiddenSnippets === undefined || isStringArray(check.forbiddenSnippets)),
};

const isStructuralCheck = (check: unknown) => {
    if (!isRecord(check) || typeof check.type !== "string") {
        return false;
    }

    if (!Object.prototype.hasOwnProperty.call(structuralCheckValidators, check.type)) {
        return false;
    }

    return structuralCheckValidators[check.type]?.(check) ?? false;
};

const isBackendTestFile = (file: unknown) =>
    isRecord(file) &&
    isSafeRelativePath(file.path) &&
    isSupportedProjectPath(file.path) &&
    typeof file.content === "string";

const hasValidTestCode = (testCode: unknown) =>
    testCode === undefined || typeof testCode === "string";

const hasValidTestFiles = (testFiles: unknown) =>
    testFiles === undefined ||
    (Array.isArray(testFiles) && testFiles.every(isBackendTestFile));

type CompileFailCase = Record<string, unknown> & { name: string; path: string };

const hasValidCompileFailIdentity = (
    entry: Record<string, unknown>,
): entry is CompileFailCase =>
    typeof entry.name === "string" &&
    /^[A-Za-z0-9_-]{1,80}$/.test(entry.name) &&
    isSafeRelativePath(entry.path) &&
    entry.path.startsWith("compile_fail/") &&
    entry.path.endsWith(".rs");

const isNonEmptyStringArray = (value: unknown) =>
    Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);

const hasValidCompileFailDiagnostics = (entry: Record<string, unknown>) =>
    isNonEmptyStringArray(entry.expectedDiagnostics) &&
    (entry.forbiddenDiagnostics === undefined ||
        (Array.isArray(entry.forbiddenDiagnostics) &&
            entry.forbiddenDiagnostics.every(isNonEmptyString)));

const isCompileFailCase = (
    entry: unknown,
    names: Set<string>,
    paths: Set<string>,
) => {
    if (
        !isRecord(entry) ||
        !hasValidCompileFailIdentity(entry) ||
        typeof entry.content !== "string" ||
        !hasValidCompileFailDiagnostics(entry) ||
        names.has(entry.name) ||
        paths.has(entry.path)
    ) {
        return false;
    }

    names.add(entry.name);
    paths.add(entry.path);
    return true;
};

const isBackendCompileFail = (value: Record<string, unknown>) => {
    if (!Array.isArray(value.cases) || value.cases.length === 0 || value.cases.length > 4) {
        return false;
    }

    const names = new Set<string>();
    const paths = new Set<string>();
    return value.cases.every((entry) => isCompileFailCase(entry, names, paths));
};

const validationStepChecks: Partial<Record<string, (value: Record<string, unknown>) => boolean>> = {
    "browser-rust": (value) => Array.isArray(value.checks),
    structural: (value) => Array.isArray(value.checks) &&
        value.checks.length > 0 &&
        value.checks.every(isStructuralCheck),
    "backend-cargo-test": (value) =>
        hasValidTestCode(value.testCode) && hasValidTestFiles(value.testFiles),
    "backend-compile-fail": isBackendCompileFail,
};

const BACKEND_VALIDATION_MODES = new Set(["backend-cargo-test", "backend-compile-fail"]);
const DEPENDENCY_SETS = new Set(["std", "advanced", "advanced-db"]);

const hasValidDependencySet = (value: Record<string, unknown>) =>
    !BACKEND_VALIDATION_MODES.has(String(value.mode)) ||
    value.dependencySet === undefined ||
    (typeof value.dependencySet === "string" && DEPENDENCY_SETS.has(value.dependencySet));

const hasValidValidationMode = (
    value: Record<string, unknown>,
): value is Record<string, unknown> & { mode: string } =>
    typeof value.mode === "string" &&
    VALIDATION_MODES.has(value.mode) &&
    value.mode !== "all";

const isValidationStep = (value: unknown) => {
    if (!isRecord(value) || !hasValidValidationMode(value)) {
        return false;
    }

    if (value.mode === "self-check") {
        return true;
    }

    return hasValidDependencySet(value) &&
        isPositiveTimeout(value.timeoutMs) &&
        (validationStepChecks[value.mode]?.(value) ?? false);
};

const isValidation = (value: unknown): value is LessonValidation => {
    if (!isRecord(value)) {
        return false;
    }

    return value.mode === "all"
        ? Array.isArray(value.validations) &&
        value.validations.length > 0 &&
        value.validations.every(isValidationStep)
        : isValidationStep(value);
};

const hasLessonIdentity = (value: Record<string, unknown>) =>
    [
        value.id,
        value.arcId,
        value.arcTitle,
        value.title,
        value.conceptId,
        value.scenario,
        value.instructions,
        value.completionExplanation,
    ].every(isNonEmptyString);

const hasLessonSchedule = (value: Record<string, unknown>) =>
    typeof value.order === "number" && Number.isFinite(value.order) &&
    typeof value.day === "number" && Number.isInteger(value.day) && value.day > 0 &&
    typeof value.arcLength === "number" && Number.isInteger(value.arcLength) && value.arcLength > 0;

const hasLessonDifficulty = (value: Record<string, unknown>) =>
    ["easy", "medium", "advanced"].includes(String(value.difficulty)) &&
    typeof value.estimatedMinutes === "number" &&
    Number.isFinite(value.estimatedMinutes) &&
    value.estimatedMinutes >= 5 && value.estimatedMinutes <= 10;

const hasLessonMetadata = (value: Record<string, unknown>) =>
    (value.schemaVersion === 1 || value.schemaVersion === 2) &&
    hasLessonIdentity(value) &&
    hasLessonSchedule(value) &&
    hasLessonDifficulty(value) &&
    typeof value.starterCode === "string";

const hasValidLessonFiles = (files: unknown): files is Lesson["files"] => {
    if (!Array.isArray(files) || files.length === 0) {
        return false;
    }

    const validFiles = files.every((file) =>
        isRecord(file) &&
        isSafeRelativePath(file.path) &&
        isSupportedProjectPath(file.path) &&
        ["editable", "readonly", "test"].includes(String(file.role)) &&
        typeof file.content === "string",
    );
    const filePaths = files.map((file) => isRecord(file) ? file.path : null);
    const editableCount = files.filter(
        (file) => isRecord(file) && file.role === "editable",
    ).length;

    return validFiles && editableCount === 1 && new Set(filePaths).size === files.length;
};

const hasValidHints = (hints: unknown): hints is Lesson["hints"] =>
    Array.isArray(hints) &&
    hints.length >= 1 &&
    hints.length <= 3 &&
    hints.every((hint) =>
        isRecord(hint) &&
        typeof hint.level === "number" &&
        isNonEmptyString(hint.body) &&
        (hint.solutionCode === undefined || typeof hint.solutionCode === "string"),
    );

const hasMatchingStarterCode = (value: Record<string, unknown>) =>
    Array.isArray(value.files) &&
    value.files.some((file) =>
        isRecord(file) &&
        file.role === "editable" &&
        file.content === value.starterCode,
    );

const isLesson = (value: unknown): value is Lesson =>
    isRecord(value) &&
    hasLessonMetadata(value) &&
    hasValidLessonFiles(value.files) &&
    hasMatchingStarterCode(value) &&
    hasValidHints(value.hints) &&
    isValidation(value.validation);

const canonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }

    if (!isRecord(value)) {
        return value;
    }

    return Object.fromEntries(
        Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
};

export const decodePlaygroundLesson = (encoded: string): PlaygroundLessonResult => {
    if (
        encoded.length === 0 ||
        encoded.length > MAX_ENCODED_LENGTH ||
        !/^[A-Za-z0-9_-]+$/.test(encoded) ||
        encoded.length % 4 === 1
    ) {
        return { ok: false, message: "This Playground link has an invalid or oversized lesson payload." };
    }

    try {
        const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
        const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
        const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

        if (bytes.byteLength > MAX_PAYLOAD_BYTES) {
            return { ok: false, message: "This Playground link has an invalid or oversized lesson payload." };
        }

        const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));

        if (!isLesson(parsed)) {
            return { ok: false, message: "This Playground link does not contain a valid Rust Daily lesson." };
        }

        return {
            ok: true,
            lesson: parsed,
            canonicalJson: JSON.stringify(canonicalize(parsed)),
        };
    } catch {
        return { ok: false, message: "This Playground link does not contain valid lesson JSON." };
    }
};

export const createPlaygroundDraftId = async (canonicalJson: string) => {
    const digest = await globalThis.crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(canonicalJson),
    );
    const fingerprint = Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, "0"),
    ).join("");

    return `playground:${fingerprint}`;
};