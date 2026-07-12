import { mkdir, mkdtemp, rename, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, dirname, join } from "node:path";
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

const main = async () => {
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

await main();
