import { lstat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { push, validateRunnerPathLimits } from "../lib/diagnostics.mjs";
import { isRecord, isString } from "../lib/primitives.mjs";
import { isSafeRelativePath } from "../lib/path-rules.mjs";
import { readSourceText } from "../lib/source-files.mjs";

const lessonDir = (lessonJsonPath) => dirname(lessonJsonPath);
const lessonSourcePath = (lessonJsonPath, sourcePath) =>
  join(lessonDir(lessonJsonPath), sourcePath);

const readLessonSource = async (lessonJsonPath, sourcePath) => {
  if (!isSafeRelativePath(sourcePath)) {
    return "";
  }

  try {
    return await readSourceText(lessonJsonPath, sourcePath);
  } catch {
    return "";
  }
};

const validateSourcePathSyntax = (errors, sourcePath, label, fieldName) => {
  if (!isString(sourcePath)) {
    push(errors, `${label} must have ${fieldName}.`);
    return false;
  }

  if (!isSafeRelativePath(sourcePath)) {
    push(errors, `${label} ${fieldName} ${sourcePath} must be normalized, relative, and safe.`);
    return false;
  }

  if (!validateRunnerPathLimits(errors, label, sourcePath, fieldName)) {
    return false;
  }

  return true;
};

const readSourcePathStats = async (fullPath) => {
  try {
    const metadata = await lstat(fullPath);
    return metadata.isSymbolicLink() ? null : metadata;
  } catch {
    return null;
  }
};

const SOURCE_PATH_KIND_VALIDATORS = {
  file: {
    label: "file",
    matches: (pathStats) => pathStats.isFile(),
  },
  directory: {
    label: "directory",
    matches: (pathStats) => pathStats.isDirectory(),
  },
};

const validateSourcePathKind = (
  errors,
  sourcePath,
  label,
  fieldName,
  expectedKind,
  pathStats,
) => {
  const kindValidator = SOURCE_PATH_KIND_VALIDATORS[expectedKind];

  if (kindValidator.matches(pathStats)) {
    return true;
  }

  push(errors, `${label} ${fieldName} ${sourcePath} must reference a ${kindValidator.label}.`);
  return false;
};

export const validateSourcePath = async (
  errors,
  lessonJsonPath,
  sourcePath,
  label,
  fieldName = "sourcePath",
  expectedKind = "file",
) => {
  if (!validateSourcePathSyntax(errors, sourcePath, label, fieldName)) {
    return false;
  }

  const fullPath = lessonSourcePath(lessonJsonPath, sourcePath);
  const pathStats = await readSourcePathStats(fullPath);

  if (!pathStats) {
    push(errors, `${label} references missing source path ${sourcePath}.`);
    return false;
  }

  return validateSourcePathKind(
    errors,
    sourcePath,
    label,
    fieldName,
    expectedKind,
    pathStats,
  );
};

const editableFile = (lesson) =>
  Array.isArray(lesson.files)
    ? lesson.files.find((file) => file.role === "editable")
    : null;

export const editablePath = (lesson) => editableFile(lesson)?.path ?? null;

const solutionSourcePath = (lesson) =>
  isRecord(lesson.author) && isString(lesson.author.solutionPath) && editablePath(lesson)
    ? `${lesson.author.solutionPath}/${editablePath(lesson)}`
    : null;

export const readSolution = async (lessonJsonPath, lesson) => {
  const sourcePath = solutionSourcePath(lesson);

  return sourcePath ? await readLessonSource(lessonJsonPath, sourcePath) : "";
};

export const readAuthorNotes = async (lessonJsonPath, lesson) => {
  if (!isRecord(lesson.author) || !isString(lesson.author.notesPath)) {
    return "";
  }

  return readLessonSource(lessonJsonPath, lesson.author.notesPath);
};

export const lessonFileByPath = (lesson, path) =>
  Array.isArray(lesson.files)
    ? lesson.files.find((file) => file.path === path)
    : null;

export const readLessonFileSource = async (lessonJsonPath, file) =>
  file?.sourcePath ? await readLessonSource(lessonJsonPath, file.sourcePath) : "";

export const solutionSnapshotSource = async (lessonJsonPath, lesson) => {
  if (!Array.isArray(lesson.files)) {
    return "";
  }

  const parts = await Promise.all(
    lesson.files
      .filter((file) => file.role !== "test")
      .map(async (file) => {
        const content =
          file.role === "editable"
            ? await readSolution(lessonJsonPath, lesson)
            : await readLessonFileSource(lessonJsonPath, file);

        return `// ${file.path}\n${content}`;
      }),
  );

  return parts.join("\n\n");
};
