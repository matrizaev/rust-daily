import { dirname, join } from "node:path";
import {
  findLessonJsonFiles,
  isString,
  pathExists,
  readJson,
} from "../shared.mjs";

export const readExistingLessons = async () => {
  const lessonJsonFiles = await findLessonJsonFiles();
  const records = await Promise.all(
    lessonJsonFiles.map(async (jsonPath) => ({
      jsonPath,
      dir: dirname(jsonPath),
      lesson: await readJson(jsonPath),
    })),
  );

  return records;
};

export const byId = (records) => new Map(records.map((record) => [record.id, record]));

export const maxLessonOrder = (lessons) =>
  lessons.reduce(
    (max, record) =>
      Number.isFinite(record.lesson.order) ? Math.max(max, record.lesson.order) : max,
    0,
  );

export const targetExistingRecord = (records, lessonDir, lessonId) =>
  records.find((record) => record.dir === lessonDir || record.lesson.id === lessonId) ?? null;

export const lessonsInArc = (records, arcId, targetRecord = null) =>
  records
    .filter((record) => record.lesson.arcId === arcId && record !== targetRecord)
    .sort((left, right) => left.lesson.day - right.lesson.day || left.lesson.order - right.lesson.order);

const projectFiles = (lesson) =>
  Array.isArray(lesson.files)
    ? lesson.files.filter((file) => file.role !== "test" && isString(file.path))
    : [];

const lessonFileByPath = (lesson, path) =>
  projectFiles(lesson).find((file) => file.path === path) ?? null;

const existingPathOrNull = async (path) =>
  (await pathExists(path)) ? path : null;

const previousSolutionSnapshotPath = (previousLessonRecord, path) =>
  join(previousLessonRecord.dir, "solution", path);

const previousStarterSnapshotPath = (previousLessonRecord, path) => {
  const previousFile = lessonFileByPath(previousLessonRecord.lesson, path);

  return previousFile?.sourcePath
    ? join(previousLessonRecord.dir, previousFile.sourcePath)
    : null;
};

export const previousSnapshotSourcePath = async (previousLessonRecord, path) => {
  if (!previousLessonRecord) {
    return null;
  }

  const solutionPath = await existingPathOrNull(
    previousSolutionSnapshotPath(previousLessonRecord, path),
  );

  if (solutionPath) {
    return solutionPath;
  }

  const starterPath = previousStarterSnapshotPath(previousLessonRecord, path);

  if (!starterPath) {
    return null;
  }

  return existingPathOrNull(starterPath);
};

export const previousProjectPaths = (previousLessonRecord) =>
  previousLessonRecord ? projectFiles(previousLessonRecord.lesson).map((file) => file.path) : [];
