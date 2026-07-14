import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  findLessonJsonFiles,
  isRecord,
  pathExists,
  push,
  readJson,
  reportErrorsOrLog,
  repoRelativePath,
  SOURCE_CONCEPTS_PATH,
} from "./shared.mjs";
import {
  validateAuthor,
  validateHints,
  validateInstructionsNameEditablePath,
  validateRealWorldFit,
} from "./source-validation/authoring.mjs";
import { validateCumulativeLessons } from "./source-validation/cumulative.mjs";
import { validateFiles } from "./source-validation/files.mjs";
import {
  validateConceptDomain,
  validateLessonConcept,
  validateLessonDomain,
  validateLessonOrder,
  validateRequiredLessonFields,
} from "./source-validation/schema.mjs";
import { validateValidation } from "./source-validation/validation-steps.mjs";

const validateLesson = async (errors, lessonJsonPath, conceptIds) => {
  const lesson = await readJson(lessonJsonPath);
  const label = repoRelativePath(lessonJsonPath);

  validateLessonDomain(errors, label, lesson);
  if (!isRecord(lesson)) {
    return null;
  }
  validateRequiredLessonFields(errors, label, lesson);
  validateLessonOrder(errors, lesson);
  validateLessonConcept(errors, lesson, conceptIds);

  await validateFiles(errors, lessonJsonPath, lesson);
  validateInstructionsNameEditablePath(errors, lesson);
  await validateRealWorldFit(errors, lessonJsonPath, lesson);
  await validateValidation(errors, lessonJsonPath, lesson);
  validateHints(errors, lesson);
  await validateAuthor(errors, lessonJsonPath, lesson);

  return lesson;
};

const readSourceConcepts = async (errors) => {
  if (!(await pathExists(SOURCE_CONCEPTS_PATH))) {
    return [];
  }
  const concepts = await readJson(SOURCE_CONCEPTS_PATH);
  if (Array.isArray(concepts)) {
    return concepts;
  }
  push(errors, "Concept source must contain a JSON array.");
  return [];
};

const readLessonRecords = async (errors, lessonJsonFiles, conceptIds) => {
  const lessonRecords = [];
  for (const lessonJsonPath of lessonJsonFiles) {
    const lesson = await validateLesson(errors, lessonJsonPath, conceptIds);
    if (lesson) {
      lessonRecords.push({ lesson, lessonJsonPath });
    }
  }
  return lessonRecords;
};

const findDuplicateLessonIds = (lessons) => {
  const seen = new Set();
  const duplicates = new Set();
  for (const lesson of lessons) {
    if (seen.has(lesson.id)) {
      duplicates.add(lesson.id);
    }
    seen.add(lesson.id);
  }
  return duplicates;
};

const reportSourceValidation = (report, errors, lessonCount) => {
  if (!report) {
    return;
  }
  reportErrorsOrLog(
    errors,
    "Source content check failed",
    `Source content check passed: ${lessonCount} lesson(s).`,
  );
};

export const validateSourceContent = async ({ report = true } = {}) => {
  const errors = [];
  const concepts = await readSourceConcepts(errors);
  const conceptIds = new Set(concepts.filter(isRecord).map((concept) => concept.id));
  const lessonJsonFiles = await findLessonJsonFiles();
  concepts.forEach((concept, index) => validateConceptDomain(errors, concept, index));
  const lessonRecords = await readLessonRecords(errors, lessonJsonFiles, conceptIds);
  await validateCumulativeLessons(errors, lessonRecords);
  const lessons = lessonRecords.map(({ lesson }) => lesson);
  findDuplicateLessonIds(lessons)
    .forEach((id) => push(errors, `Duplicate source lesson id: ${id}.`));
  reportSourceValidation(report, errors, lessons.length);
  return { concepts, errors, lessonRecords, lessons };
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await validateSourceContent();
}
