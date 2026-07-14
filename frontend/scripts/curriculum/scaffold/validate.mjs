import {
  ARC_ID_PATTERN,
  compileFailCasePath,
  VALID_DIFFICULTIES,
} from "./names.mjs";
import {
  byId,
  previousSnapshotSourcePath,
} from "./state.mjs";
import {
  duplicateValues,
  isCompileFailPath,
  isRunnerPath,
  isSafeRelativePath,
  isString,
  isTestFilePath,
  KNOWN_DEPENDENCY_SETS,
  pathExists,
  REQUIRED_LIB_PATH,
  repoRelativePath,
} from "../shared.mjs";

const requireStringOption = (options, key, flag, errors) => {
  if (!isString(options[key])) {
    errors.push(`${flag} is required.`);
  }
};

export const validateRequiredOptions = (options, errors) => {
  [
    ["arc", "--arc"],
    ["lesson", "--lesson"],
    ["title", "--title"],
    ["concept", "--concept"],
    ["difficulty", "--difficulty"],
    ["dependencySet", "--dependency-set"],
    ["editable", "--editable"],
  ].forEach(([key, flag]) => requireStringOption(options, key, flag, errors));
};

const validateSafePath = (errors, path, label) => {
  if (!isSafeRelativePath(path)) {
    errors.push(`${label} must be normalized, relative, and safe.`);
    return false;
  }

  return true;
};

const validateRunnerPath = (errors, path, label) => {
  if (validateSafePath(errors, path, label) && !isRunnerPath(path)) {
    errors.push(`${label} must be supported by the runner.`);
  }
};

const validateTestPath = (errors, path, label) => {
  if (validateSafePath(errors, path, label) && !isTestFilePath(path)) {
    errors.push(`${label} must be under tests/ and end with .rs.`);
  }
};

const validateCompileFailName = (errors, name) => {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(name)) {
    errors.push(`${name} must use only ASCII letters, digits, _, and -.`);
  }
};

const validateCompileFailPath = (errors, path, name) => {
  if (validateSafePath(errors, path, `${name} compile-fail path`) && !isCompileFailPath(path)) {
    errors.push(`${name} compile-fail path must be under compile_fail/ and end with .rs.`);
  }
};

const validateArcId = (errors, arcId) => {
  if (!isString(arcId)) {
    return;
  }

  if (!isSafeRelativePath(arcId) || !ARC_ID_PATTERN.test(arcId)) {
    errors.push("--arc must be a lowercase, hyphen-separated path segment.");
  }
};

const validateNoDuplicates = (errors, values, label) => {
  duplicateValues(values).forEach((value) => {
    errors.push(`Duplicate ${label} ${value}.`);
  });
};

const validateNoConflictingRegistration = (errors, exists, shouldRegister, id, label) => {
  if (exists && shouldRegister) {
    errors.push(`${id} already exists; remove --register-${label}.`);
  }
};

const validateRequiredRegistration = (errors, exists, shouldRegister, id, label) => {
  if (!exists && !shouldRegister) {
    errors.push(`${id} does not exist; pass --register-${label}${label === "arc" ? " with arc metadata" : ""}.`);
  }
};

const validateMissingRecordConflict = (errors, exists, recordsById, id, label) => {
  if (!exists && recordsById.has(id)) {
    errors.push(`${id} conflicts with an existing ${label}.`);
  }
};

const validateArcMetadata = (options, errors) => {
  if (!options.registerArc) {
    return;
  }

  [
    ["arcTitle", "--arc-title"],
    ["arcPillar", "--arc-pillar"],
    ["arcDescription", "--arc-description"],
  ].forEach(([key, flag]) => requireStringOption(options, key, flag, errors));
};

const validateArcState = ({
  errors,
  options,
  arcsById,
  existingArc,
}) => {
  validateNoConflictingRegistration(errors, existingArc, options.registerArc, options.arc, "arc");
  validateRequiredRegistration(errors, existingArc, options.registerArc, options.arc, "arc");
  validateArcMetadata(options, errors);
  validateMissingRecordConflict(errors, existingArc, arcsById, options.arc, "arc");
};

const validateConceptState = ({
  errors,
  options,
  conceptsById,
  existingConcept,
}) => {
  validateNoConflictingRegistration(
    errors,
    existingConcept,
    options.registerConcept,
    options.concept,
    "concept",
  );
  validateRequiredRegistration(
    errors,
    existingConcept,
    options.registerConcept,
    options.concept,
    "concept",
  );
  validateMissingRecordConflict(errors, existingConcept, conceptsById, options.concept, "concept");
};

const validateReadonlySources = async ({
  errors,
  readonly,
  previousLessonRecord,
}) => {
  if (readonly.length === 0) {
    return;
  }

  if (!previousLessonRecord) {
    errors.push("--readonly requires a previous lesson in the same arc.");
    return;
  }

  await Promise.all(
    readonly.map(async (path) => {
      if (!isSafeRelativePath(path) || !isRunnerPath(path)) {
        return;
      }

      const source = await previousSnapshotSourcePath(previousLessonRecord, path);

      if (!source) {
        errors.push(`Missing previous solution file for readonly path ${path}.`);
      }
    }),
  );
};

const validateGlobalOrder = (options, errors) => {
  if (options.order !== options.expectedOrder) {
    errors.push(`Lesson ${options.lesson} is out of order; expected ${String(options.expectedOrder).padStart(3, "0")}.`);
  }
};

const validateArcDay = (options, errors) => {
  const maxArcDay = options.arcLessons.reduce(
    (max, record) => Math.max(max, record.lesson.day ?? 0),
    0,
  );

  if (options.day !== maxArcDay + 1) {
    errors.push(`${options.arc} day must be ${maxArcDay + 1}.`);
  }
};

const validateArcLengthAssertion = (options, errors) => {
  if (
    options.requestedArcLength !== null &&
    options.requestedArcLength !== options.targetLessonCount
  ) {
    errors.push(`--arc-length must equal the authored arc length ${options.targetLessonCount}.`);
  }
};

const validateSequentialOrder = (options, errors) => {
  if (!options.lessonName) {
    return;
  }

  validateGlobalOrder(options, errors);
  validateArcDay(options, errors);
  validateArcLengthAssertion(options, errors);
};

const validateLessonDirectoryAvailable = (options, targetExists, errors) => {
  if (targetExists && !options.force) {
    errors.push(`${repoRelativePath(options.lessonDir)} already exists; pass --force to overwrite placeholders.`);
  }
};

const validateLessonIdAvailable = (options, errors) => {
  if (options.targetRecord && options.targetRecord.dir !== options.lessonDir) {
    errors.push(`${options.lessonId} already exists in ${repoRelativePath(options.targetRecord.dir)}.`);
  }
};

const validateDuplicateLesson = async (options, errors) => {
  const targetExists = await pathExists(options.lessonDir);

  validateLessonDirectoryAvailable(options, targetExists, errors);
  validateLessonIdAvailable(options, errors);
};

const validateRuntimeFiles = (options, errors) => {
  validateRunnerPath(errors, options.editable, "--editable");
  options.readonly.forEach((path) => validateRunnerPath(errors, path, `--readonly ${path}`));
  options.tests.forEach((path) => validateTestPath(errors, path, `--test ${path}`));

  const runtimePaths = [options.editable, ...options.readonly, ...options.tests];

  validateNoDuplicates(errors, runtimePaths, "runtime path");

  if (![options.editable, ...options.readonly].includes(REQUIRED_LIB_PATH)) {
    errors.push(`backend validation requires ${REQUIRED_LIB_PATH} as editable or readonly.`);
  }
};

const validateCompileFailCases = (options, errors) => {
  options.compileFail.forEach((name) => {
    validateCompileFailName(errors, name);
    validateCompileFailPath(errors, compileFailCasePath(name), name);
  });
  validateNoDuplicates(errors, options.compileFail, "compile-fail case");
  validateNoDuplicates(
    errors,
    options.compileFail.map((name) => compileFailCasePath(name)),
    "compile-fail path",
  );
};

export const validateNormalizedOptions = async (options, errors) => {
  if (!VALID_DIFFICULTIES.has(options.difficulty)) {
    errors.push("--difficulty must be easy, medium, or advanced.");
  }

  if (!KNOWN_DEPENDENCY_SETS.has(options.dependencySet)) {
    errors.push(`Unknown dependency set ${String(options.dependencySet)}.`);
  }

  validateArcId(errors, options.arc);
  validateArcState({
    errors,
    options,
    arcsById: byId(options.arcs),
    existingArc: options.existingArc,
  });
  validateConceptState({
    errors,
    options,
    conceptsById: byId(options.concepts),
    existingConcept: options.existingConcept,
  });
  validateSequentialOrder(options, errors);
  await validateDuplicateLesson(options, errors);
  validateRuntimeFiles(options, errors);
  validateCompileFailCases(options, errors);
  await validateReadonlySources({
    errors,
    readonly: options.readonly,
    previousLessonRecord: options.previousLessonRecord,
  });
};
