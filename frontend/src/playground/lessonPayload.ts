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

const validationStepChecks: Partial<Record<string, (value: Record<string, unknown>) => boolean>> = {
    "browser-rust": (value) => Array.isArray(value.checks),
    structural: (value) => {
        const isStringArray = (items: unknown): items is string[] =>
            Array.isArray(items) && items.every((item) => typeof item === "string");
        const isStructuralCheck = (check: unknown): boolean => {
            if (!isRecord(check)) {
                return false;
            }

            switch (check.type) {
                case "enum_unit_variants":
                    return typeof check.enumName === "string" &&
                        isStringArray(check.requiredVariants);
                case "struct_fields":
                    return typeof check.structName === "string" &&
                        Array.isArray(check.requiredFields) &&
                        check.requiredFields.every((field) =>
                            isRecord(field) && typeof field.name === "string" &&
                            isStringArray(field.typeIncludes));
                case "tuple_struct_fields":
                    return typeof check.structName === "string" &&
                        isStringArray(check.requiredTypes);
                case "impl_trait_for_type":
                case "derived_trait_for_type":
                    return typeof check.traitName === "string" &&
                        typeof check.typeName === "string";
                case "impl_method":
                    return typeof check.implFor === "string" &&
                        typeof check.methodName === "string" &&
                        isStringArray(check.requiredSignatureIncludes);
                case "function_signature":
                    return typeof check.functionName === "string" &&
                        isStringArray(check.requiredSignatureIncludes);
                case "source_includes":
                    return isStringArray(check.requiredSnippets) &&
                        (check.forbiddenSnippets === undefined ||
                            isStringArray(check.forbiddenSnippets));
                default:
                    return false;
            }
        };

        return Array.isArray(value.checks) && value.checks.length > 0 &&
            value.checks.every(isStructuralCheck);
    },
    "backend-cargo-test": (value) =>
        (value.testCode === undefined || typeof value.testCode === "string") &&
        (value.testFiles === undefined ||
            (Array.isArray(value.testFiles) && value.testFiles.every((file) =>
                isRecord(file) &&
                isSafeRelativePath(file.path) &&
                isSupportedProjectPath(file.path) &&
                typeof file.content === "string",
            ))),
    "backend-compile-fail": (value) => {
        if (!Array.isArray(value.cases) || value.cases.length === 0 || value.cases.length > 4) {
            return false;
        }

        const names = new Set<string>();
        const paths = new Set<string>();
        return value.cases.every((entry) => {
            if (
                !isRecord(entry) ||
                typeof entry.name !== "string" ||
                !/^[A-Za-z0-9_-]{1,80}$/.test(entry.name) ||
                !isSafeRelativePath(entry.path) ||
                !entry.path.startsWith("compile_fail/") ||
                !entry.path.endsWith(".rs") ||
                typeof entry.content !== "string" ||
                !Array.isArray(entry.expectedDiagnostics) ||
                entry.expectedDiagnostics.length === 0 ||
                !entry.expectedDiagnostics.every(isNonEmptyString) ||
                (entry.forbiddenDiagnostics !== undefined &&
                    (!Array.isArray(entry.forbiddenDiagnostics) ||
                        !entry.forbiddenDiagnostics.every(isNonEmptyString))) ||
                names.has(entry.name) || paths.has(entry.path)
            ) {
                return false;
            }

            names.add(entry.name);
            paths.add(entry.path);
            return true;
        });
    },
};

const isValidationStep = (value: unknown) => {
    if (
        !isRecord(value) ||
        typeof value.mode !== "string" ||
        !VALIDATION_MODES.has(value.mode) ||
        value.mode === "all"
    ) {
        return false;
    }

    if (value.mode === "self-check") {
        return true;
    }

    if (
        (value.mode === "backend-cargo-test" || value.mode === "backend-compile-fail") &&
        value.dependencySet !== undefined &&
        (typeof value.dependencySet !== "string" ||
            !["std", "advanced", "advanced-db"].includes(value.dependencySet))
    ) {
        return false;
    }

    return isPositiveTimeout(value.timeoutMs) &&
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