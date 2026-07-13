import { mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  FRONTEND_CONCEPTS_PATH,
  FRONTEND_CONTENT_REVISION_PATH,
  FRONTEND_LESSON_DETAILS_DIR,
  FRONTEND_LESSON_INDEX_PATH,
  FRONTEND_LESSONS_PATH,
  inlineCompileFailValidation,
  isCompileFailValidation,
  lessonStarterCode,
  pathExists,
  readSourceText,
} from "./shared.mjs";
import { validateSourceContent } from "./validate-source-content.mjs";

const inlineFile = async (lessonJsonPath, file) => {
  if (typeof file.content === "string") {
    const { sourcePath: _sourcePath, ...rest } = file;

    return rest;
  }

  if (typeof file.sourcePath !== "string") {
    throw new Error(`${lessonJsonPath} file ${file.path} is missing content or sourcePath.`);
  }

  const { sourcePath: _sourcePath, ...rest } = file;

  return {
    ...rest,
    content: await readSourceText(lessonJsonPath, file.sourcePath),
  };
};

const lessonIndexFromDetail = (lesson) => ({
  schemaVersion: lesson.schemaVersion,
  id: lesson.id,
  arcId: lesson.arcId,
  arcTitle: lesson.arcTitle,
  order: lesson.order,
  day: lesson.day,
  arcLength: lesson.arcLength,
  title: lesson.title,
  conceptId: lesson.conceptId,
  difficulty: lesson.difficulty,
  estimatedMinutes: lesson.estimatedMinutes,
  scenario: lesson.scenario,
});

const lessonValidationDetail = (lesson) =>
  lesson.validation ? { validation: lesson.validation } : {};

const lessonDetailFromLesson = (lesson) => ({
  id: lesson.id,
  schemaVersion: lesson.schemaVersion,
  detail: {
    instructions: lesson.instructions,
    starterCode: lessonStarterCode(lesson),
    files: lesson.files,
    hints: lesson.hints,
    completionExplanation: lesson.completionExplanation,
    ...lessonValidationDetail(lesson),
  },
});

const conceptFromSource = (concept) => ({
  id: concept.id,
  name: concept.name,
  description: concept.description,
  prerequisites: concept.prerequisites,
  difficulty: concept.difficulty,
  lessonIds: concept.lessonIds,
  tags: concept.tags,
  masteryThreshold: concept.masteryThreshold,
});

const testFilesDuplicateLessonFiles = (lessonFiles, testFiles) => {
  const lessonFileContents = new Map(
    lessonFiles.map((file) => [file.path, file.content]),
  );

  return testFiles.every(
    (file) => lessonFileContents.get(file.path) === file.content,
  );
};

const inlineAllValidation = async (
  lessonJsonPath,
  validation,
  lessonFiles,
) => ({
  ...validation,
  validations: await Promise.all(
    validation.validations.map((step) =>
      inlineBackendValidation(lessonJsonPath, step, lessonFiles),
    ),
  ),
});

const shouldInlineTestFiles = (validation) =>
  validation.mode === "backend-cargo-test" && Array.isArray(validation.testFiles);

const inlineBackendTestValidation = async (
  lessonJsonPath,
  validation,
  lessonFiles,
) => {
  const testFiles = await Promise.all(
    validation.testFiles.map((file) => inlineFile(lessonJsonPath, file)),
  );

  if (testFilesDuplicateLessonFiles(lessonFiles, testFiles)) {
    const { testFiles: _testFiles, ...validationWithoutTestFiles } = validation;

    return validationWithoutTestFiles;
  }

  return {
    ...validation,
    testFiles,
  };
};

const inlineBackendValidation = async (
  lessonJsonPath,
  validation,
  lessonFiles,
) => {
  if (validation.mode === "all") {
    return inlineAllValidation(lessonJsonPath, validation, lessonFiles);
  }

  if (!shouldInlineTestFiles(validation)) {
    return isCompileFailValidation(validation)
      ? inlineCompileFailValidation(lessonJsonPath, validation)
      : validation;
  }

  return inlineBackendTestValidation(lessonJsonPath, validation, lessonFiles);
};

const inlineLessonFiles = async (lessonJsonPath, lesson) =>
  Array.isArray(lesson.files)
    ? Promise.all(lesson.files.map((file) => inlineFile(lessonJsonPath, file)))
    : [];

const inlineLessonValidation = (lessonJsonPath, lesson, files) =>
  lesson.validation
    ? inlineBackendValidation(lessonJsonPath, lesson.validation, files)
    : undefined;

const frontendLessonFromSource = async (lessonJsonPath, lesson) => {
  const files = await inlineLessonFiles(lessonJsonPath, lesson);
  const validation = await inlineLessonValidation(lessonJsonPath, lesson, files);
  return {
    ...lessonIndexFromDetail(lesson),
    instructions: lesson.instructions,
    files,
    hints: lesson.hints.map(({ level, body, solutionCode }) => ({
      level,
      body,
      ...(solutionCode === undefined ? {} : { solutionCode }),
    })),
    completionExplanation: lesson.completionExplanation,
    validation,
  };
};

const readSourceLessons = async (lessonRecords) =>
  Promise.all(lessonRecords.map(({ lesson, lessonJsonPath }) =>
    frontendLessonFromSource(lessonJsonPath, lesson)));

const sortLessons = (lessons) =>
  [...lessons].sort((left, right) => {
    const leftOrder = Number.isFinite(left.order) ? left.order : left.day;
    const rightOrder = Number.isFinite(right.order) ? right.order : right.day;

    return leftOrder - rightOrder || left.id.localeCompare(right.id);
  });

const SAFE_LESSON_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d{3}$/;

const writeJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true });
  const temporaryPath = `${path}.${process.pid}.tmp`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`);
  await rename(temporaryPath, path);
};

const writeLessonDetails = async (directory, lessons) =>
  Promise.all(
    lessons.map((lesson) =>
      {
        if (!SAFE_LESSON_ID.test(lesson.id)) {
          throw new Error(`Refusing unsafe lesson detail output id: ${String(lesson.id)}.`);
        }
        return writeJson(
          join(directory, `${lesson.id}.json`),
          lessonDetailFromLesson(lesson),
        );
      },
    ),
  );

const collectFiles = async (root, prefix = "") => {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await readdir(root, { withFileTypes: true });
  const childFiles = await Promise.all(
    entries.map((entry) => {
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const fullPath = join(root, entry.name);

      return entry.isDirectory()
        ? collectFiles(fullPath, relativePath)
        : [relativePath];
    }),
  );

  return childFiles.flat().sort();
};

const fileContentsEqual = async (left, right) => {
  try {
    const [leftContent, rightContent] = await Promise.all([
      readFile(left, "utf8"),
      readFile(right, "utf8"),
    ]);

    return leftContent === rightContent;
  } catch {
    return false;
  }
};

const compareGeneratedFile = async (staged, target, label) => {
  if (!(await pathExists(target))) {
    return [`Generated ${label} is missing.`];
  }

  return (await fileContentsEqual(staged, target))
    ? []
    : [`Generated ${label} is out of sync.`];
};

const compareGeneratedDirectory = async (staged, target, label) => {
  const [stagedFiles, targetFiles] = await Promise.all([
    collectFiles(staged),
    collectFiles(target),
  ]);
  const errors = [];
  const stagedSet = new Set(stagedFiles);
  const targetSet = new Set(targetFiles);

  stagedFiles
    .filter((path) => !targetSet.has(path))
    .forEach((path) => errors.push(`Generated ${label}/${path} is missing.`));
  targetFiles
    .filter((path) => !stagedSet.has(path))
    .forEach((path) => errors.push(`Generated ${label}/${path} has no source.`));

  for (const path of stagedFiles.filter((item) => targetSet.has(item))) {
    if (!(await fileContentsEqual(join(staged, path), join(target, path)))) {
      errors.push(`Generated ${label}/${path} is out of sync.`);
    }
  }

  return errors;
};

const compareGeneratedCorpus = async ({
  stagedLessons,
  stagedIndex,
  stagedConcepts,
  stagedRevision,
  stagedDetails,
}) => [
  ...(await compareGeneratedFile(stagedLessons, FRONTEND_LESSONS_PATH, "lessons.json")),
  ...(await compareGeneratedFile(stagedIndex, FRONTEND_LESSON_INDEX_PATH, "lessonIndex.json")),
  ...(await compareGeneratedFile(stagedConcepts, FRONTEND_CONCEPTS_PATH, "concepts.json")),
  ...(await compareGeneratedFile(
    stagedRevision,
    FRONTEND_CONTENT_REVISION_PATH,
    "contentRevision.json",
  )),
  ...(await compareGeneratedDirectory(
    stagedDetails,
    FRONTEND_LESSON_DETAILS_DIR,
    "lesson details",
  )),
];

const moveStagedTarget = async ({ staged, target }, moved) => {
  const backup = `${target}.${process.pid}.bak`;
  if (await pathExists(target)) {
    await rename(target, backup);
  }
  moved.push({ backup, target });
  await rename(staged, target);
};

const restoreMovedTarget = async ({ backup, target }) => {
  await rm(target, { force: true, recursive: true });
  if (await pathExists(backup)) {
    await rename(backup, target);
  }
};

const restoreMovedTargets = (moved) =>
  Promise.all([...moved].reverse().map(restoreMovedTarget));

const removeBackups = (moved) =>
  Promise.all(moved.map(({ backup }) => rm(backup, { force: true, recursive: true })));

const replaceGeneratedCorpus = async (stagedTargets) => {
  const moved = [];
  try {
    for (const stagedTarget of stagedTargets) {
      await moveStagedTarget(stagedTarget, moved);
    }
  } catch (error) {
    await restoreMovedTargets(moved);
    throw error;
  }
  await removeBackups(moved);
};

export const generateFrontendContent = async ({ check = false } = {}) => {
  const validation = await validateSourceContent({ report: false });
  if (validation.errors.length > 0) {
    throw new Error(`Refusing to generate invalid source content (${validation.errors.join("; ")}).`);
  }
  const sourceLessons = await readSourceLessons(validation.lessonRecords);
  const sourceConcepts = validation.concepts;
  const lessons = sortLessons(sourceLessons);
  const lessonIndex = lessons.map(lessonIndexFromDetail);
  const concepts = sourceConcepts.map(conceptFromSource);
  const contentRevision = createHash("sha256")
    .update(JSON.stringify({ concepts, lessons }))
    .digest("hex")
    .slice(0, 16);

  const stagingRoot = await mkdtemp(join(dirname(FRONTEND_LESSON_DETAILS_DIR), ".content-generation-"));
  const stagedDetails = join(stagingRoot, "lessons");
  const stagedLessons = join(stagingRoot, basename(FRONTEND_LESSONS_PATH));
  const stagedIndex = join(stagingRoot, basename(FRONTEND_LESSON_INDEX_PATH));
  const stagedConcepts = join(stagingRoot, basename(FRONTEND_CONCEPTS_PATH));
  const stagedRevision = join(stagingRoot, basename(FRONTEND_CONTENT_REVISION_PATH));

  try {
    await Promise.all([
      writeJson(stagedLessons, lessons),
      writeJson(stagedIndex, lessonIndex),
      writeJson(stagedConcepts, concepts),
      writeJson(stagedRevision, { revision: contentRevision }),
      writeLessonDetails(stagedDetails, lessons),
    ]);

    if (check) {
      const errors = await compareGeneratedCorpus({
        stagedLessons,
        stagedIndex,
        stagedConcepts,
        stagedRevision,
        stagedDetails,
      });

      if (errors.length > 0) {
        console.error(`Generated content is out of sync with source with ${errors.length} issue(s):`);
        errors.forEach((error) => console.error(`- ${error}`));
        process.exitCode = 1;
        return;
      }

      console.log(`Generated content is current: ${lessons.length} lessons and ${concepts.length} concepts.`);
      return;
    }

    await replaceGeneratedCorpus([
      { staged: stagedLessons, target: FRONTEND_LESSONS_PATH },
      { staged: stagedIndex, target: FRONTEND_LESSON_INDEX_PATH },
      { staged: stagedConcepts, target: FRONTEND_CONCEPTS_PATH },
      { staged: stagedRevision, target: FRONTEND_CONTENT_REVISION_PATH },
      { staged: stagedDetails, target: FRONTEND_LESSON_DETAILS_DIR },
    ]);
  } finally {
    await rm(stagingRoot, { force: true, recursive: true });
  }

  console.log(`Generated ${lessons.length} lessons and ${concepts.length} concepts.`);
};

const usage = () => `Usage:
  node frontend/scripts/curriculum/generate-frontend-content.mjs [--check]

Options:
  --check   Compare generated output without writing files.
  --help    Show this help.
`;

const parseArgs = (argv) => {
  const options = { check: false };
  const errors = [];

  for (const arg of argv) {
    if (arg === "--check") {
      options.check = true;
    } else if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else {
      errors.push(`Unknown argument ${arg}.`);
    }
  }

  return { options, errors };
};

const main = async () => {
  const { options, errors } = parseArgs(process.argv.slice(2));

  if (options.help) {
    console.log(usage());
    return;
  }

  if (errors.length > 0) {
    errors.forEach((error) => console.error(error));
    console.error(usage());
    process.exitCode = 64;
    return;
  }

  await generateFrontendContent(options);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
