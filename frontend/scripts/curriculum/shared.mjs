import { readdir, readFile, stat } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = join(SCRIPT_DIR, "..", "..");
const REPO_ROOT = join(FRONTEND_DIR, "..");
const LESSONS_ROOT = join(REPO_ROOT, "lessons");
export const FRONTEND_LESSONS_PATH = join(
  FRONTEND_DIR,
  "src",
  "content",
  "lessons.json",
);
export const FRONTEND_LESSON_INDEX_PATH = join(
  FRONTEND_DIR,
  "src",
  "content",
  "lessonIndex.json",
);
export const FRONTEND_LESSON_DETAILS_DIR = join(
  FRONTEND_DIR,
  "public",
  "content",
  "lessons",
);
export const FRONTEND_CONCEPTS_PATH = join(
  FRONTEND_DIR,
  "src",
  "content",
  "concepts.json",
);
export const SOURCE_CONCEPTS_PATH = join(LESSONS_ROOT, "concepts.json");

export const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
export const isRecord = (value) => typeof value === "object" && value !== null;
export const isString = (value) => typeof value === "string" && value.trim().length > 0;
export const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
const DEPENDENCY_SETS = new Set(["std", "advanced"]);
export const push = (errors, message) => {
  errors.push(message);
};

export const validateKnownDependencySet = (errors, lessonId, validation) => {
  const dependencySet = validation.dependencySet ?? "std";

  if (!DEPENDENCY_SETS.has(dependencySet)) {
    push(
      errors,
      `${lessonId} backend validation has unknown dependencySet ${String(dependencySet)}.`,
    );
  }
};

const hintObjectKind = (allowString) =>
  allowString ? "a string or object" : "an object";

const validateHintShape = (errors, lessonId, hint, index, allowString) => {
  if (allowString && typeof hint === "string") {
    return false;
  }

  if (!isRecord(hint)) {
    push(errors, `${lessonId} hint ${index + 1} must be ${hintObjectKind(allowString)}.`);
    return false;
  }

  return true;
};

const validateHintLevel = (errors, lessonId, hint, index) => {
  if (hint.level !== index + 1) {
    push(errors, `${lessonId} hint ${index + 1} must use level ${index + 1}.`);
  }
};

const validateHintBody = (errors, lessonId, hint, index) => {
  if (!isString(hint.body)) {
    push(errors, `${lessonId} hint ${index + 1} must have body.`);
  }
};

const validateHintSolution = (errors, lessonId, hint, index) => {
  if ("solutionCode" in hint && typeof hint.solutionCode !== "string") {
    push(errors, `${lessonId} hint ${index + 1} solutionCode must be a string.`);
  }
};

export const validateHintObject = (
  errors,
  lessonId,
  hint,
  index,
  { allowString = false } = {},
) => {
  if (!validateHintShape(errors, lessonId, hint, index, allowString)) {
    return;
  }

  validateHintLevel(errors, lessonId, hint, index);
  validateHintBody(errors, lessonId, hint, index);
  validateHintSolution(errors, lessonId, hint, index);
};

export const reportErrorsOrLog = (errors, failureSummary, successSummary) => {
  if (errors.length > 0) {
    console.error(`${failureSummary} with ${errors.length} issue(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(successSummary);
};

export const pathExists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};

const findFiles = async (root, filename) => {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await readdir(root, { withFileTypes: true });
  const childResults = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);

      if (entry.isDirectory()) {
        return findFiles(path, filename);
      }

      return entry.isFile() && entry.name === filename ? [path] : [];
    }),
  );

  return childResults.flat().sort();
};

export const findLessonJsonFiles = () => findFiles(LESSONS_ROOT, "lesson.json");

export const readSourceText = async (lessonJsonPath, sourcePath) => {
  const lessonDir = dirname(lessonJsonPath);
  const absolutePath = join(lessonDir, sourcePath);

  return readFile(absolutePath, "utf8");
};

export const isCompileFailValidation = (validation) =>
  validation?.mode === "backend-compile-fail" &&
  Array.isArray(validation.cases);

export const inlineCompileFailValidation = async (lessonJsonPath, validation) => ({
  ...validation,
  cases: await Promise.all(
    validation.cases.map(async (compileFailCase) => {
      const { sourcePath, ...runtimeCase } = compileFailCase;

      return {
        ...runtimeCase,
        path: sourcePath,
        content: await readSourceText(lessonJsonPath, sourcePath),
      };
    }),
  ),
});

export const repoRelativePath = (path) => relative(REPO_ROOT, path);
