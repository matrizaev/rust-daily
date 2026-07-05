import { dirname, join } from "node:path";
import {
  findLessonJsonFiles,
  isNumber,
  isRecord,
  isString,
  pathExists,
  push,
  readJson,
  reportErrorsOrLog,
  repoRelativePath,
  SOURCE_CONCEPTS_PATH,
  validateHintObject,
} from "./shared.mjs";

const validateSourcePath = async (errors, lessonJsonPath, sourcePath, label) => {
  if (!isString(sourcePath)) {
    push(errors, `${label} must have sourcePath.`);
    return;
  }

  const fullPath = join(dirname(lessonJsonPath), sourcePath);

  if (!(await pathExists(fullPath))) {
    push(errors, `${label} references missing file ${sourcePath}.`);
  }
};

// fallow-ignore-next-line complexity
const validateFiles = async (errors, lessonJsonPath, lesson) => {
  if (!Array.isArray(lesson.files) || lesson.files.length === 0) {
    push(errors, `${lesson.id} must define files.`);
    return;
  }

  const editableFiles = lesson.files.filter((file) => file.role === "editable");

  if (editableFiles.length !== 1) {
    push(errors, `${lesson.id} must have exactly one editable file for this implementation slice.`);
  }

  for (const file of lesson.files) {
    if (!isRecord(file) || !isString(file.path) || !isString(file.role)) {
      push(errors, `${lesson.id} has an invalid file entry.`);
      continue;
    }

    if (!["editable", "readonly", "test"].includes(file.role)) {
      push(errors, `${lesson.id} file ${file.path} has invalid role ${file.role}.`);
    }

    if (file.path.includes("..") || file.path.startsWith("/")) {
      push(errors, `${lesson.id} file ${file.path} must be relative and safe.`);
    }

    if (file.content === undefined) {
      await validateSourcePath(errors, lessonJsonPath, file.sourcePath, `${lesson.id} ${file.path}`);
    }
  }
};

const validationSteps = (validation) =>
  validation?.mode === "all" && Array.isArray(validation.validations)
    ? validation.validations
    : [validation];

// fallow-ignore-next-line complexity
const validateValidation = async (errors, lessonJsonPath, lesson) => {
  if (!isRecord(lesson.validation)) {
    push(errors, `${lesson.id} must define validation.`);
    return;
  }

  for (const validation of validationSteps(lesson.validation)) {
    if (validation?.mode !== "backend-cargo-test") {
      continue;
    }

    const hasTestCode = isString(validation.testCode);
    const testFiles = Array.isArray(validation.testFiles) ? validation.testFiles : [];

    if (!hasTestCode && testFiles.length === 0) {
      push(errors, `${lesson.id} backend validation must define testCode or testFiles.`);
    }

    for (const testFile of testFiles) {
      await validateSourcePath(
        errors,
        lessonJsonPath,
        testFile.sourcePath,
        `${lesson.id} backend test ${testFile.path}`,
      );
    }
  }
};

const validateHints = (errors, lesson) => {
  if (!Array.isArray(lesson.hints) || lesson.hints.length < 1 || lesson.hints.length > 3) {
    push(errors, `${lesson.id} must have 1-3 hints.`);
    return;
  }

  lesson.hints.forEach((hint, index) =>
    validateHintObject(errors, lesson.id, hint, index),
  );
};

const validateAuthor = async (errors, lessonJsonPath, lesson) => {
  if (!isRecord(lesson.author)) {
    push(errors, `${lesson.id} must define author metadata.`);
    return;
  }

  await validateSourcePath(errors, lessonJsonPath, lesson.author.notesPath, `${lesson.id} notes`);

  if (!isString(lesson.author.solutionPath)) {
    push(errors, `${lesson.id} must define author.solutionPath.`);
    return;
  }

  if (!(await pathExists(join(dirname(lessonJsonPath), lesson.author.solutionPath)))) {
    push(errors, `${lesson.id} references missing solutionPath.`);
  }
};

// fallow-ignore-next-line complexity
const validateLesson = async (errors, lessonJsonPath, conceptIds) => {
  const lesson = await readJson(lessonJsonPath);
  const label = repoRelativePath(lessonJsonPath);
  const required = [
    "schemaVersion",
    "id",
    "arcId",
    "arcTitle",
    "order",
    "day",
    "arcLength",
    "title",
    "conceptId",
    "difficulty",
    "estimatedMinutes",
    "scenario",
    "instructions",
    "hints",
    "completionExplanation",
    "validation",
  ];

  for (const field of required) {
    if (!(field in lesson)) {
      push(errors, `${label} is missing ${field}.`);
    }
  }

  if (!isNumber(lesson.order)) {
    push(errors, `${lesson.id} must define numeric order.`);
  }

  if (!conceptIds.has(lesson.conceptId)) {
    push(errors, `${lesson.id} references missing concept ${lesson.conceptId}.`);
  }

  await validateFiles(errors, lessonJsonPath, lesson);
  await validateValidation(errors, lessonJsonPath, lesson);
  validateHints(errors, lesson);
  await validateAuthor(errors, lessonJsonPath, lesson);

  return lesson;
};

const main = async () => {
  const concepts = await pathExists(SOURCE_CONCEPTS_PATH)
    ? await readJson(SOURCE_CONCEPTS_PATH)
    : [];
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const lessonJsonFiles = await findLessonJsonFiles();
  const errors = [];
  const lessons = [];

  for (const lessonJsonPath of lessonJsonFiles) {
    lessons.push(await validateLesson(errors, lessonJsonPath, conceptIds));
  }

  const duplicateIds = lessons
    .map((lesson) => lesson.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);

  duplicateIds.forEach((id) => push(errors, `Duplicate source lesson id: ${id}.`));

  reportErrorsOrLog(
    errors,
    "Source content check failed",
    `Source content check passed: ${lessons.length} lesson(s).`,
  );
};

await main();
