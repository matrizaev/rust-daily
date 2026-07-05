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
export const push = (errors, message) => {
  errors.push(message);
};

// fallow-ignore-next-line complexity
export const validateHintObject = (
  errors,
  lessonId,
  hint,
  index,
  { allowString = false } = {},
) => {
  if (allowString && typeof hint === "string") {
    return;
  }

  if (!isRecord(hint)) {
    const kind = allowString ? "a string or object" : "an object";

    push(errors, `${lessonId} hint ${index + 1} must be ${kind}.`);
    return;
  }

  if (hint.level !== index + 1) {
    push(errors, `${lessonId} hint ${index + 1} must use level ${index + 1}.`);
  }

  if (!isString(hint.body)) {
    push(errors, `${lessonId} hint ${index + 1} must have body.`);
  }

  if ("solutionCode" in hint && typeof hint.solutionCode !== "string") {
    push(errors, `${lessonId} hint ${index + 1} solutionCode must be a string.`);
  }
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

// fallow-ignore-next-line complexity
const findFiles = async (root, filename) => {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await readdir(root, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const path = join(root, entry.name);

    if (entry.isDirectory()) {
      results.push(...await findFiles(path, filename));
    } else if (entry.isFile() && entry.name === filename) {
      results.push(path);
    }
  }

  return results.sort();
};

export const findLessonJsonFiles = () => findFiles(LESSONS_ROOT, "lesson.json");

export const readSourceText = async (lessonJsonPath, sourcePath) => {
  const lessonDir = dirname(lessonJsonPath);
  const absolutePath = join(lessonDir, sourcePath);

  return readFile(absolutePath, "utf8");
};

export const repoRelativePath = (path) => relative(REPO_ROOT, path);
