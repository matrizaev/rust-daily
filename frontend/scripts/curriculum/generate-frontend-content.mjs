import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  findLessonJsonFiles,
  FRONTEND_CONCEPTS_PATH,
  FRONTEND_LESSON_DETAILS_DIR,
  FRONTEND_LESSON_INDEX_PATH,
  FRONTEND_LESSONS_PATH,
  pathExists,
  readJson,
  readSourceText,
  SOURCE_CONCEPTS_PATH,
} from "./shared.mjs";

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

const lessonIndexFromDetail = (lesson) => {
  const {
    files: _files,
    hints: _hints,
    completionExplanation: _completionExplanation,
    validation: _validation,
    instructions: _instructions,
    ...indexLesson
  } = lesson;

  return indexLesson;
};

const testFilesDuplicateLessonFiles = (lessonFiles, testFiles) => {
  const lessonFileContents = new Map(
    lessonFiles.map((file) => [file.path, file.content]),
  );

  return testFiles.every(
    (file) => lessonFileContents.get(file.path) === file.content,
  );
};

// fallow-ignore-next-line complexity
const inlineBackendValidation = async (
  lessonJsonPath,
  validation,
  lessonFiles,
) => {
  if (validation.mode === "all") {
    return {
      ...validation,
      validations: await Promise.all(
        validation.validations.map((step) =>
          inlineBackendValidation(lessonJsonPath, step, lessonFiles),
        ),
      ),
    };
  }

  if (validation.mode !== "backend-cargo-test" || !Array.isArray(validation.testFiles)) {
    return validation;
  }

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

// fallow-ignore-next-line complexity
const frontendLessonFromSource = async (lessonJsonPath) => {
  const lesson = await readJson(lessonJsonPath);
  const files = Array.isArray(lesson.files)
    ? await Promise.all(lesson.files.map((file) => inlineFile(lessonJsonPath, file)))
    : [];
  const editableFile = files.find((file) => file.role === "editable");
  const validation = lesson.validation
    ? await inlineBackendValidation(lessonJsonPath, lesson.validation, files)
    : undefined;
  const {
    author: _author,
    starterCode: _starterCode,
    ...shippedLesson
  } = lesson;

  return {
    ...shippedLesson,
    files,
    validation,
  };
};

const readSourceLessons = async () => {
  const lessonJsonFiles = await findLessonJsonFiles();

  return Promise.all(lessonJsonFiles.map(frontendLessonFromSource));
};

const mergeById = (baseItems, sourceItems) => {
  const sourceIds = new Set(sourceItems.map((item) => item.id));

  return [
    ...baseItems.filter((item) => !sourceIds.has(item.id)),
    ...sourceItems,
  ];
};

const sortLessons = (lessons) =>
  [...lessons].sort((left, right) => {
    const leftOrder = Number.isFinite(left.order) ? left.order : left.day;
    const rightOrder = Number.isFinite(right.order) ? right.order : right.day;

    return leftOrder - rightOrder || left.id.localeCompare(right.id);
  });

const writeJson = async (path, value) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
};

const writeLessonDetails = async (lessons) =>
  Promise.all(
    lessons.map((lesson) =>
      writeJson(
        join(FRONTEND_LESSON_DETAILS_DIR, `${lesson.id}.json`),
        lesson,
      ),
    ),
  );

const main = async () => {
  const [currentLessons, currentConcepts, sourceLessons] = await Promise.all([
    readJson(FRONTEND_LESSONS_PATH),
    readJson(FRONTEND_CONCEPTS_PATH),
    readSourceLessons(),
  ]);
  const sourceConcepts = await pathExists(SOURCE_CONCEPTS_PATH)
    ? await readJson(SOURCE_CONCEPTS_PATH)
    : [];
  const lessons = sortLessons(mergeById(currentLessons, sourceLessons));
  const lessonIndex = lessons.map(lessonIndexFromDetail);
  const concepts = mergeById(currentConcepts, sourceConcepts);

  await Promise.all([
    writeJson(FRONTEND_LESSONS_PATH, lessons),
    writeJson(FRONTEND_LESSON_INDEX_PATH, lessonIndex),
    writeJson(FRONTEND_CONCEPTS_PATH, concepts),
    writeLessonDetails(lessons),
  ]);

  console.log(`Generated ${lessons.length} lessons and ${concepts.length} concepts.`);
};

await main();
