import { join } from "node:path";
import { applyPresetDefaults } from "../scaffold-presets.mjs";
import {
  LESSONS_ROOT,
  readJson,
  SOURCE_ARCS_PATH,
  SOURCE_CONCEPTS_PATH,
} from "../shared.mjs";
import {
  DEFAULT_TEST_PATH,
  lessonIdFromName,
  lessonOrderFromName,
  parseLessonName,
  unique,
} from "./names.mjs";
import {
  byId,
  lessonsInArc,
  maxLessonOrder,
  previousProjectPaths,
  readExistingLessons,
  targetExistingRecord,
} from "./state.mjs";
import {
  validateNormalizedOptions,
  validateRequiredOptions,
} from "./validate.mjs";

const parsePositiveInteger = (value, label, errors, defaultValue = null) => {
  if (value === undefined) {
    return defaultValue;
  }

  if (!/^[1-9][0-9]*$/.test(String(value))) {
    errors.push(`${label} must be a positive integer.`);
    return defaultValue;
  }

  return Number.parseInt(value, 10);
};

const parseNumericOptions = (initialOptions, errors) => ({
  ...initialOptions,
  estimatedMinutes: parsePositiveInteger(
    initialOptions.estimatedMinutes,
    "--estimated-minutes",
    errors,
    8,
  ),
  arcLength: parsePositiveInteger(initialOptions.arcLength, "--arc-length", errors, null),
});

const readCurriculumState = async () => {
  const [arcs, concepts, lessonRecords] = await Promise.all([
    readJson(SOURCE_ARCS_PATH),
    readJson(SOURCE_CONCEPTS_PATH),
    readExistingLessons(),
  ]);

  return { arcs, concepts, lessonRecords };
};

const expectedLessonOrder = (options, targetRecord, lessonRecords) =>
  options.force && targetRecord ? targetRecord.lesson.order : maxLessonOrder(lessonRecords) + 1;

const defaultedTests = (tests) =>
  tests.length > 0 ? unique(tests) : [DEFAULT_TEST_PATH];

const lessonDirForOptions = (options) =>
  join(LESSONS_ROOT, options.arc || "", options.lesson || "");

const previousLessonInArc = (arcLessons) => arcLessons.at(-1) || null;

const derivedLessonState = (options, lessonName, state) => {
  const lessonId = lessonIdFromName(lessonName);
  const lessonDir = lessonDirForOptions(options);
  const targetRecord = targetExistingRecord(state.lessonRecords, lessonDir, lessonId);
  const arcLessons = lessonsInArc(state.lessonRecords, options.arc, targetRecord);
  const previousLessonRecord = previousLessonInArc(arcLessons);
  const targetLessonCount = arcLessons.length + 1;
  const autoReadonly = previousProjectPaths(previousLessonRecord)
    .filter((path) => path !== options.editable);

  return {
    arcLessons,
    autoReadonly,
    lessonDir,
    lessonId,
    previousLessonRecord,
    targetLessonCount,
    targetRecord,
  };
};

const buildNormalizedOptions = (options, lessonName, state) => {
  const derived = derivedLessonState(options, lessonName, state);

  return {
    ...options,
    ...state,
    lessonName,
    lessonId: derived.lessonId,
    lessonDir: derived.lessonDir,
    targetRecord: derived.targetRecord,
    expectedOrder: expectedLessonOrder(options, derived.targetRecord, state.lessonRecords),
    arcLessons: derived.arcLessons,
    previousLessonRecord: derived.previousLessonRecord,
    existingArc: byId(state.arcs).get(options.arc),
    existingConcept: byId(state.concepts).get(options.concept),
    order: lessonOrderFromName(lessonName),
    day: derived.targetLessonCount,
    arcLength: derived.targetLessonCount,
    requestedArcLength: options.arcLength,
    targetLessonCount: derived.targetLessonCount,
    readonly: unique([...derived.autoReadonly, ...options.readonly]),
    tests: defaultedTests(options.tests),
    compileFail: unique(options.compileFail),
  };
};

export const normalizeInputs = async (initialOptions, initialErrors) => {
  const errors = [...initialErrors];
  const options = applyPresetDefaults(parseNumericOptions(initialOptions, errors), errors);

  validateRequiredOptions(options, errors);

  const lessonName = parseLessonName(options.lesson, errors);

  if (errors.length > 0) {
    return { options, errors };
  }

  const normalized = buildNormalizedOptions(options, lessonName, await readCurriculumState());

  await validateNormalizedOptions(normalized, errors);

  return { options: normalized, errors };
};
