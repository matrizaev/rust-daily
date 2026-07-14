import { push } from "../lib/diagnostics.mjs";
import { isRecord, isString } from "../lib/primitives.mjs";
import {
  isFixturePath,
  isRunnerPath,
  isSafeRelativePath,
  isSourceFilePath,
  isTestdataPath,
  isTestFilePath,
  VALID_FILE_ROLES,
} from "../lib/path-rules.mjs";
import { validateSourcePath } from "./source-access.mjs";

const validateEditableFileCount = (errors, lesson) => {
  const editableFiles = lesson.files.filter((file) => file.role === "editable");

  if (editableFiles.length !== 1) {
    push(errors, `${lesson.id} must have exactly one editable file.`);
  }
};

const validateFileRecord = (errors, lesson, file) => {
  if (!isRecord(file) || !isString(file.path) || !isString(file.role)) {
    push(errors, `${lesson.id} has an invalid file entry.`);
    return false;
  }

  return true;
};

const validateFileRole = (errors, lesson, file) => {
  if (!VALID_FILE_ROLES.has(file.role)) {
    push(errors, `${lesson.id} file ${file.path} has invalid role ${file.role}.`);
  }
};

export const validateFilePath = (errors, lesson, file) => {
  if (!isSafeRelativePath(file.path)) {
    push(errors, `${lesson.id} file ${file.path} must be normalized, relative, and safe.`);
    return;
  }

  if (!isRunnerPath(file.path)) {
    push(errors, `${lesson.id} file ${file.path} is not supported by the runner.`);
  }
};

const isReadonlySupportPath = (path) => isFixturePath(path) || isTestdataPath(path);

const validateEditablePath = (errors, lesson, file) => {
  if (!isSourceFilePath(file.path)) {
    push(errors, `${lesson.id} editable file ${file.path} must be under src/**/*.rs.`);
  }
};

const validateReadonlyPath = (errors, lesson, file) => {
  if (!isSourceFilePath(file.path) && !isReadonlySupportPath(file.path)) {
    push(
      errors,
      `${lesson.id} readonly file ${file.path} must be under src/**/*.rs, fixtures/**, or testdata/**.`,
    );
  }
};

const validateTestPath = (errors, lesson, file) => {
  if (!isTestFilePath(file.path)) {
    push(errors, `${lesson.id} test file ${file.path} must be under tests/**/*.rs.`);
  }
};

const validateSupportPathRole = (errors, lesson, file) => {
  if (!isReadonlySupportPath(file.path) || file.role === "readonly") {
    return;
  }

  push(errors, `${lesson.id} support file ${file.path} must use readonly role.`);
};

const FILE_ROLE_PATH_VALIDATORS = {
  editable: validateEditablePath,
  readonly: validateReadonlyPath,
  test: validateTestPath,
};

export const validateFileRolePath = (errors, lesson, file) => {
  if (!VALID_FILE_ROLES.has(file.role) || !isSafeRelativePath(file.path)) {
    return;
  }

  FILE_ROLE_PATH_VALIDATORS[file.role](errors, lesson, file);
  validateSupportPathRole(errors, lesson, file);
};

const validateFileSource = async (errors, lessonJsonPath, lesson, file) => {
  if (file.content !== undefined) {
    push(errors, `${lesson.id} file ${file.path} must use sourcePath instead of inline content.`);
  }

  await validateSourcePath(errors, lessonJsonPath, file.sourcePath, `${lesson.id} ${file.path}`);
};

const validateFile = async (errors, lessonJsonPath, lesson, file) => {
  if (!validateFileRecord(errors, lesson, file)) {
    return;
  }

  validateFileRole(errors, lesson, file);
  validateFilePath(errors, lesson, file);
  validateFileRolePath(errors, lesson, file);
  await validateFileSource(errors, lessonJsonPath, lesson, file);
};

const validateUniqueFilePath = (errors, lesson, seenPaths, file) => {
  if (!isRecord(file) || !isString(file.path)) {
    return;
  }

  if (seenPaths.has(file.path)) {
    push(errors, `${lesson.id} has duplicate file path ${file.path}.`);
  }

  seenPaths.add(file.path);
};

export const validateFiles = async (errors, lessonJsonPath, lesson) => {
  if (!Array.isArray(lesson.files) || lesson.files.length === 0) {
    push(errors, `${lesson.id} must define files.`);
    return;
  }

  validateEditableFileCount(errors, lesson);
  const seenPaths = new Set();

  for (const file of lesson.files) {
    await validateFile(errors, lessonJsonPath, lesson, file);
    validateUniqueFilePath(errors, lesson, seenPaths, file);
  }
};
