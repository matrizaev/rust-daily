import { lstat, mkdir, readdir, readFile, realpath, stat, writeFile } from "node:fs/promises";
import { writeSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = join(SCRIPT_DIR, "..", "..");
const REPO_ROOT = join(FRONTEND_DIR, "..");
export const LESSONS_ROOT = process.env.LESSONS_ROOT_OVERRIDE
  ? resolve(process.env.LESSONS_ROOT_OVERRIDE)
  : join(REPO_ROOT, "lessons");
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
export const FRONTEND_CONTENT_REVISION_PATH = join(
  FRONTEND_DIR,
  "src",
  "content",
  "contentRevision.json",
);
export const SOURCE_CONCEPTS_PATH = join(LESSONS_ROOT, "concepts.json");
export const SOURCE_ARCS_PATH = join(LESSONS_ROOT, "arcs.json");

export const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
export const isRecord = (value) => typeof value === "object" && value !== null;
export const isString = (value) => typeof value === "string" && value.trim().length > 0;
export const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
export const KNOWN_DEPENDENCY_SETS = new Set(["std", "advanced"]);
export const VALID_FILE_ROLES = new Set(["editable", "readonly", "test"]);
export const REQUIRED_LIB_PATH = "src/lib.rs";
export const TEST_FILE_PATTERN = "tests/**/*.rs";
export const COMPILE_FAIL_PREFIX = "compile_fail/";

export const lessonStarterCode = (lesson) => {
  if (lesson.starterCode !== undefined) {
    return lesson.starterCode;
  }
  return lesson.files?.find((file) => file.role === "editable")?.content ?? "";
};

const MAX_RUNNER_PATH_BYTES = 240;
const MAX_RUNNER_PATH_COMPONENT_BYTES = 120;
const MAX_DIAGNOSTIC_SNIPPETS_PER_CASE = 16;
const MAX_DIAGNOSTIC_SNIPPET_BYTES = 512;
const MAX_DIAGNOSTIC_TOTAL_BYTES = 8192;
export const push = (errors, message) => {
  errors.push(message);
};

const validateRunnerPathByteLimit = (errors, label, path, fieldName) => {
  if (Buffer.byteLength(path) <= MAX_RUNNER_PATH_BYTES) {
    return true;
  }

  push(errors, `${label} ${fieldName} exceeds ${MAX_RUNNER_PATH_BYTES} bytes.`);
  return false;
};

const validateRunnerPathComponentLimit = (errors, label, path, fieldName) => {
  const exceedsLimit = path
    .split("/")
    .some((component) => Buffer.byteLength(component) > MAX_RUNNER_PATH_COMPONENT_BYTES);
  if (!exceedsLimit) {
    return true;
  }

  push(
    errors,
    `${label} ${fieldName} has a component exceeding ${MAX_RUNNER_PATH_COMPONENT_BYTES} bytes.`,
  );
  return false;
};

export const validateRunnerPathLimits = (errors, label, path, fieldName) => {
  const pathValid = validateRunnerPathByteLimit(errors, label, path, fieldName);
  const componentsValid = validateRunnerPathComponentLimit(errors, label, path, fieldName);
  return pathValid && componentsValid;
};

const validateDiagnosticCountLimit = (errors, label, snippets) => {
  if (snippets.length > MAX_DIAGNOSTIC_SNIPPETS_PER_CASE) {
    push(errors, `${label} has more than ${MAX_DIAGNOSTIC_SNIPPETS_PER_CASE} diagnostic snippets.`);
  }
};

const validateDiagnosticSnippetByteLimit = (errors, label, snippets) => {
  const snippetTooLarge = snippets.some(
    (snippet) => typeof snippet === "string" && Buffer.byteLength(snippet) > MAX_DIAGNOSTIC_SNIPPET_BYTES,
  );
  if (snippetTooLarge) {
    push(errors, `${label} has a diagnostic snippet exceeding ${MAX_DIAGNOSTIC_SNIPPET_BYTES} bytes.`);
  }
};

const validateDiagnosticTotalByteLimit = (errors, label, snippets) => {
  const totalBytes = snippets
    .filter((snippet) => typeof snippet === "string")
    .reduce((total, snippet) => total + Buffer.byteLength(snippet), 0);
  if (totalBytes > MAX_DIAGNOSTIC_TOTAL_BYTES) {
    push(errors, `${label} diagnostic snippets exceed ${MAX_DIAGNOSTIC_TOTAL_BYTES} bytes in total.`);
  }
};

const normalizedDiagnosticSet = (snippets) =>
  new Set(
    snippets
      .filter((snippet) => typeof snippet === "string" && snippet.trim().length > 0)
      .map((snippet) => snippet.trim()),
  );

const validateDiagnosticSetRelations = (errors, label, expected, forbidden) => {
  const normalizedExpected = normalizedDiagnosticSet(expected);
  const normalizedForbidden = normalizedDiagnosticSet(forbidden);
  if (normalizedExpected.size !== expected.length || normalizedForbidden.size !== forbidden.length) {
    push(errors, `${label} diagnostic snippets must be unique after trimming.`);
  }
  if ([...normalizedExpected].some((snippet) => normalizedForbidden.has(snippet))) {
    push(errors, `${label} cannot both expect and forbid the same diagnostic snippet.`);
  }
};

export const validateDiagnosticSnippetLimits = (errors, label, expected, forbidden) => {
  const snippets = [...expected, ...forbidden];
  validateDiagnosticCountLimit(errors, label, snippets);
  validateDiagnosticSnippetByteLimit(errors, label, snippets);
  validateDiagnosticTotalByteLimit(errors, label, snippets);
  validateDiagnosticSetRelations(errors, label, expected, forbidden);
};

export const validateDiagnosticAggregateByteLimit = (errors, label, snippets) => {
  validateDiagnosticTotalByteLimit(errors, label, snippets);
};

export const validateKnownDependencySet = (errors, lessonId, validation) => {
  const dependencySet = validation.dependencySet ?? "std";

  if (!KNOWN_DEPENDENCY_SETS.has(dependencySet)) {
    push(
      errors,
      `${lessonId} backend validation has unknown dependencySet ${String(dependencySet)}.`,
    );
  }
};

const formatJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

export const writeJsonFile = async (path, value) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, formatJson(value));
};

export const isTestFilePath = (path) => path.startsWith("tests/") && path.endsWith(".rs");
export const isSourceFilePath = (path) => path.startsWith("src/") && path.endsWith(".rs");
export const isFixturePath = (path) => path.startsWith("fixtures/");
export const isTestdataPath = (path) => path.startsWith("testdata/");
export const isRunnerPath = (path) =>
  [isSourceFilePath, isTestFilePath, isFixturePath, isTestdataPath].some((matches) =>
    matches(path),
  );
export const isCompileFailPath = (path) =>
  path.startsWith(COMPILE_FAIL_PREFIX) && path.endsWith(".rs");

const hasUnsafePathComponent = (path) =>
  path.split("/").some((component) => component === "" || component === "." || component === "..");

const unsafePathPredicates = [
  (path) => path.startsWith("/"),
  (path) => path.includes("\\"),
  (path) => path.includes("\0"),
  (path) => path.endsWith("/"),
  hasUnsafePathComponent,
];

const hasUnsafePathSyntax = (path) =>
  unsafePathPredicates.some((isUnsafe) => isUnsafe(path));

export const isSafeRelativePath = (path) => isString(path) && !hasUnsafePathSyntax(path);
export const normalizeSource = (source) =>
  source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "");

const recordOrder = (record) =>
  Number.isFinite(record.orderStart) ? record.orderStart : record.order ?? 0;

const compareRecordsByOrderThenId = (left, right) =>
  recordOrder(left) - recordOrder(right) || left.id.localeCompare(right.id);

export const sortRecordsByOrderThenId = (records) =>
  [...records].sort(compareRecordsByOrderThenId);

export const sortRecordsById = (records) =>
  [...records].sort((left, right) => left.id.localeCompare(right.id));

export const duplicateValues = (values) => {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  });

  return [...duplicates];
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
    writeSync(2, `${failureSummary} with ${errors.length} issue(s):\n`);
    errors.forEach((error) => writeSync(2, `- ${error}\n`));
    process.exitCode = 1;
    return;
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

const matchingFile = (path, filename, entry) =>
  entry.isFile() && entry.name === filename ? [path] : [];

const findFilesForEntry = async (root, filename, entry) => {
  const path = join(root, entry.name);
  if (entry.isSymbolicLink()) {
    throw new Error(`Source corpus must not contain symlinks: ${path}`);
  }
  if (entry.isDirectory()) {
    return findFiles(path, filename);
  }
  return matchingFile(path, filename, entry);
};

const findFiles = async (root, filename) => {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await readdir(root, { withFileTypes: true });
  const childResults = await Promise.all(
    entries.map((entry) => findFilesForEntry(root, filename, entry)),
  );

  return childResults.flat().sort();
};

export const findLessonJsonFiles = () => findFiles(LESSONS_ROOT, "lesson.json");

const assertSafeSourcePath = (sourcePath) => {
  if (!isSafeRelativePath(sourcePath)) {
    throw new Error(`${sourcePath} is not a safe relative source path.`);
  }
};

const assertNotSymlink = (sourcePath, metadata) => {
  if (metadata.isSymbolicLink()) {
    throw new Error(`${sourcePath} must not be a symlink.`);
  }
};

const assertContainedSourcePath = (sourcePath, lessonDir, canonicalPath) => {
  const relativePath = relative(lessonDir, canonicalPath);
  const escapes = relativePath === "" || relativePath.startsWith("..") || relativePath.includes("../");
  if (escapes) {
    throw new Error(`${sourcePath} escapes its lesson directory.`);
  }
};

export const readSourceText = async (lessonJsonPath, sourcePath) => {
  assertSafeSourcePath(sourcePath);
  const lessonDir = await realpath(dirname(lessonJsonPath));
  const absolutePath = join(lessonDir, sourcePath);
  const metadata = await lstat(absolutePath);
  assertNotSymlink(sourcePath, metadata);
  const canonicalPath = await realpath(absolutePath);
  assertContainedSourcePath(sourcePath, lessonDir, canonicalPath);
  return readFile(canonicalPath, "utf8");
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
