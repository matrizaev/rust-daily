import { readFile } from "node:fs/promises";
import {
  isNumber,
  isRecord,
  isString,
  push,
  reportErrorsOrLog,
  validateHintObject,
} from "./curriculum/shared.mjs";

const LESSONS_PATH = new URL("../src/content/lessons.json", import.meta.url);
const CONCEPTS_PATH = new URL("../src/content/concepts.json", import.meta.url);
const MINIMUM_LESSON_COUNT = 30;
const DIFFICULTIES = new Set(["easy", "medium", "advanced"]);
const VALIDATION_MODES = new Set([
  "structural",
  "browser-rust",
  "self-check",
  "backend-cargo-test",
  "all",
]);
const RUST_RUNTIME_VALIDATION_MODES = new Set([
  "browser-rust",
  "backend-cargo-test",
]);
const STRUCTURAL_TYPES = new Set([
  "enum_unit_variants",
  "struct_fields",
  "tuple_struct_fields",
  "impl_trait_for_type",
  "impl_method",
  "function_signature",
  "source_includes",
]);
const FORBIDDEN_PROMISES = [
  "compiled",
  "compiles",
  "cargo test",
  "tests passed",
  "run tests",
];

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const isStringArray = (value) => Array.isArray(value) && value.every(isString);
const hintText = (hint) => typeof hint === "string" ? hint : hint?.body;
const lessonHintTexts = (lesson) =>
  Array.isArray(lesson.hints) ? lesson.hints.map(hintText).filter(isString) : [];
const hasPositiveTimeout = (validation) =>
  isNumber(validation.timeoutMs) && validation.timeoutMs > 0;
const hasNonEmptyChecks = (validation) =>
  Array.isArray(validation.checks) && validation.checks.length > 0;

const validationMode = (validation) =>
  isRecord(validation) && typeof validation.mode === "string"
    ? validation.mode
    : "";

const validationSteps = (validation) =>
  isRecord(validation) &&
  validation.mode === "all" &&
  Array.isArray(validation.validations)
    ? validation.validations
    : [];

const validationHasRuntimeMode = (validation) =>
  RUST_RUNTIME_VALIDATION_MODES.has(validationMode(validation)) ||
  validationSteps(validation).some(validationHasRuntimeMode);

const getDuplicateValues = (values) => {
  const seen = new Set();
  const duplicates = new Set();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return [...duplicates];
};

const validateRequiredFields = (errors, label, value, fields) => {
  for (const field of fields) {
    if (!(field in value)) {
      push(errors, `${label} is missing ${field}.`);
    }
  }
};

const validateDifficulty = (errors, label, difficulty) => {
  if (!DIFFICULTIES.has(difficulty)) {
    push(errors, `${label} has invalid difficulty ${String(difficulty)}.`);
  }
};

const validateHintCount = (errors, lesson) => {
  if (!Array.isArray(lesson.hints) || lesson.hints.length < 1 || lesson.hints.length > 3) {
    push(errors, `${lesson.id} must have 1-3 hints.`);
  }
};

const validateHints = (errors, lesson) => {
  validateHintCount(errors, lesson);

  if (!Array.isArray(lesson.hints)) {
    return;
  }

  lesson.hints.forEach((hint, index) =>
    validateHintObject(errors, lesson.id, hint, index, { allowString: true }),
  );
};

const validateEstimatedMinutes = (errors, lesson) => {
  if (!isNumber(lesson.estimatedMinutes) || lesson.estimatedMinutes < 5 || lesson.estimatedMinutes > 10) {
    push(errors, `${lesson.id} estimatedMinutes must be between 5 and 10.`);
  }
};

const validateNoCompilationPromises = (errors, lesson) => {
  const copy = [lesson.title, ...lessonHintTexts(lesson), lesson.completionExplanation]
    .join(" ")
    .toLowerCase();
  const forbidden = FORBIDDEN_PROMISES.find((phrase) => copy.includes(phrase));

  if (
    forbidden &&
    !validationHasRuntimeMode(lesson.validation)
  ) {
    push(errors, `${lesson.id} promises unsupported Rust runtime behavior: ${forbidden}.`);
  }
};

const validateStringFields = (errors, check, path, fields) => {
  for (const field of fields) {
    if (!isString(check[field])) {
      push(errors, `${path} ${field} must be a non-empty string.`);
    }
  }
};

const isStructFieldRequirement = (field) =>
  isRecord(field) && isString(field.name) && isStringArray(field.typeIncludes);

const validateStructFieldRequirements = (errors, check, path) => {
  const invalidField = check.requiredFields.find(
    (field) => !isStructFieldRequirement(field),
  );

  if (invalidField) {
    push(errors, `${path} has an invalid struct field requirement.`);
  }
};

const validateFieldCheck = (errors, check, path) => {
  validateStringFields(errors, check, path, ["structName"]);

  if (!Array.isArray(check.requiredFields)) {
    push(errors, `${path} requiredFields must be an array.`);
    return;
  }

  validateStructFieldRequirements(errors, check, path);
};

const validateTupleFieldCheck = (errors, check, path) => {
  validateStringFields(errors, check, path, ["structName"]);

  if (!isStringArray(check.requiredTypes)) {
    push(errors, `${path} requiredTypes must be a non-empty string array.`);
  }
};

const validateIncludesCheck = (errors, check, path) => {
  if (!isStringArray(check.requiredSnippets)) {
    push(errors, `${path} requiredSnippets must be a non-empty string array.`);
  }

  if ("forbiddenSnippets" in check && !isStringArray(check.forbiddenSnippets)) {
    push(errors, `${path} forbiddenSnippets must be a string array.`);
  }
};

const validateStructuralCheck = (errors, check, path) => {
  if (!isRecord(check) || !STRUCTURAL_TYPES.has(check.type)) {
    push(errors, `${path} has unknown structural check type.`);
    return;
  }

  const validators = {
    enum_unit_variants: () => {
      validateStringFields(errors, check, path, ["enumName"]);
      if (!isStringArray(check.requiredVariants)) {
        push(errors, `${path} requiredVariants must be a non-empty string array.`);
      }
    },
    struct_fields: () => validateFieldCheck(errors, check, path),
    tuple_struct_fields: () => validateTupleFieldCheck(errors, check, path),
    impl_trait_for_type: () => validateStringFields(errors, check, path, ["traitName", "typeName"]),
    impl_method: () => {
      validateStringFields(errors, check, path, ["implFor", "methodName"]);
      if (!isStringArray(check.requiredSignatureIncludes)) {
        push(errors, `${path} requiredSignatureIncludes must be a non-empty string array.`);
      }
    },
    function_signature: () => {
      validateStringFields(errors, check, path, ["functionName"]);
      if (!isStringArray(check.requiredSignatureIncludes)) {
        push(errors, `${path} requiredSignatureIncludes must be a non-empty string array.`);
      }
    },
    source_includes: () => validateIncludesCheck(errors, check, path),
  };

  validators[check.type]();
};

const isKnownValidation = (validation) =>
  isRecord(validation) && VALIDATION_MODES.has(validation.mode);

const validateStructuralValidation = (errors, lesson, validation) => {
  if (!hasPositiveTimeout(validation)) {
    push(errors, `${lesson.id} structural validation must have timeoutMs.`);
  }

  if (!hasNonEmptyChecks(validation)) {
    push(errors, `${lesson.id} structural validation must have checks.`);
    return;
  }

  validation.checks.forEach((check, index) =>
    validateStructuralCheck(errors, check, `${lesson.id}.checks[${index}]`),
  );
};

// fallow-ignore-next-line complexity
const validateBackendValidation = (errors, lesson, validation) => {
  if (!hasPositiveTimeout(validation)) {
    push(errors, `${lesson.id} backend validation must have timeoutMs.`);
  }

  const hasTestCode = isString(validation.testCode);
  const hasTestFiles =
    Array.isArray(validation.testFiles) &&
    validation.testFiles.length > 0 &&
    validation.testFiles.every(
      (file) => isRecord(file) && isString(file.path) && isString(file.content),
    );

  if (!hasTestCode && !hasTestFiles) {
    push(errors, `${lesson.id} backend validation must have testCode or testFiles.`);
  }
};

const validateAllValidation = (errors, lesson, validation) => {
  if (!Array.isArray(validation.validations) || validation.validations.length === 0) {
    push(errors, `${lesson.id} all validation must have validations.`);
    return;
  }

  validation.validations.forEach((validationStep, index) => {
    const stepLesson = {
      ...lesson,
      id: `${lesson.id}.validations[${index}]`,
      validation: validationStep,
    };

    if (validationStep?.mode === "all") {
      push(errors, `${stepLesson.id} must not nest all validation.`);
      return;
    }

    validateValidation(errors, stepLesson);
  });
};

const VALIDATION_VALIDATORS = {
  structural: validateStructuralValidation,
  "backend-cargo-test": validateBackendValidation,
  all: validateAllValidation,
  "browser-rust": () => undefined,
  "self-check": () => undefined,
};

const validateValidation = (errors, lesson) => {
  const validation = lesson.validation;

  if (!isKnownValidation(validation)) {
    push(errors, `${lesson.id} has invalid validation metadata.`);
    return;
  }

  VALIDATION_VALIDATORS[validation.mode](errors, lesson, validation);
};

const validateLesson = (errors, lesson) => {
  const required = [
    "id",
    "arcId",
    "arcTitle",
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

  validateRequiredFields(errors, `Lesson ${lesson.id ?? "(missing id)"}`, lesson, required);

  if (!isString(lesson.starterCode) && !Array.isArray(lesson.files)) {
    push(errors, `${lesson.id} must have starterCode or files.`);
  }

  validateDifficulty(errors, lesson.id, lesson.difficulty);
  validateEstimatedMinutes(errors, lesson);
  validateHints(errors, lesson);
  validateValidation(errors, lesson);
  validateNoCompilationPromises(errors, lesson);
};

const validateConceptDifficulty = (errors, concept) => {
  const hasValidDifficulties =
    Array.isArray(concept.difficulty) &&
    concept.difficulty.every((item) => DIFFICULTIES.has(item));

  if (!hasValidDifficulties) {
    push(errors, `${concept.id} has invalid difficulty list.`);
  }
};

const validateConceptLessonIds = (errors, concept) => {
  if (!isStringArray(concept.lessonIds)) {
    push(errors, `${concept.id} lessonIds must be a non-empty string array.`);
  }
};

const validateConcept = (errors, concept) => {
  const required = [
    "id",
    "name",
    "description",
    "prerequisites",
    "difficulty",
    "lessonIds",
    "tags",
    "masteryThreshold",
  ];

  validateRequiredFields(errors, `Concept ${concept.id ?? "(missing id)"}`, concept, required);
  validateConceptDifficulty(errors, concept);
  validateConceptLessonIds(errors, concept);
};

const validateUniqueIds = (errors, lessons, concepts) => {
  for (const duplicate of getDuplicateValues(lessons.map((lesson) => lesson.id))) {
    push(errors, `Duplicate lesson id: ${duplicate}.`);
  }

  for (const duplicate of getDuplicateValues(concepts.map((concept) => concept.id))) {
    push(errors, `Duplicate concept id: ${duplicate}.`);
  }
};

const validateLessonConceptReferences = (errors, lessons, conceptIds) => {
  for (const lesson of lessons) {
    if (!conceptIds.has(lesson.conceptId)) {
      push(errors, `${lesson.id} references missing concept ${lesson.conceptId}.`);
    }
  }
};

const validateConceptLessonReferences = (errors, linkedLessonIds, lessonIds) => {
  for (const lessonId of linkedLessonIds) {
    if (!lessonIds.has(lessonId)) {
      push(errors, `Concept references missing lesson ${lessonId}.`);
    }
  }
};

const validateSingleConceptLink = (errors, linkedLessonIds, lessonId) => {
  if (linkedLessonIds.filter((linkedId) => linkedId === lessonId).length !== 1) {
    push(errors, `${lessonId} must appear in exactly one concept lessonIds list.`);
  }
};

const validateUniqueConceptLessonLinks = (errors, linkedLessonIds, lessonIds) => {
  for (const lessonId of lessonIds) {
    validateSingleConceptLink(errors, linkedLessonIds, lessonId);
  }
};

const validateConceptLinks = (errors, lessons, concepts) => {
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const linkedLessonIds = concepts.flatMap((concept) => concept.lessonIds);

  validateLessonConceptReferences(errors, lessons, conceptIds);
  validateConceptLessonReferences(errors, linkedLessonIds, lessonIds);
  validateUniqueConceptLessonLinks(errors, linkedLessonIds, lessonIds);
};

const getArcDays = (arcLessons) =>
  arcLessons.map((lesson) => lesson.day).sort((a, b) => a - b);

const getExpectedDays = (arcLength) =>
  Array.from({ length: arcLength }, (_, index) => index + 1);

const hasContiguousArcDays = (arcLessons, arcLength) =>
  arcLessons.length === arcLength &&
  getExpectedDays(arcLength).join(",") === getArcDays(arcLessons).join(",");

const validateArcs = (errors, lessons) => {
  const arcIds = [...new Set(lessons.map((lesson) => lesson.arcId))];

  for (const arcId of arcIds) {
    const arcLessons = lessons.filter((lesson) => lesson.arcId === arcId);
    const arcLength = arcLessons[0]?.arcLength;

    if (!hasContiguousArcDays(arcLessons, arcLength)) {
      push(errors, `${arcId} must have contiguous days 1 through ${arcLength}.`);
    }
  }
};

const validateContent = (lessons, concepts) => {
  const errors = [];

  if (!Array.isArray(lessons) || lessons.length < MINIMUM_LESSON_COUNT) {
    push(errors, `Expected at least ${MINIMUM_LESSON_COUNT} lessons.`);
  }

  if (!Array.isArray(concepts)) {
    push(errors, "Concepts file must contain an array.");
    return errors;
  }

  lessons.forEach((lesson) => validateLesson(errors, lesson));
  concepts.forEach((concept) => validateConcept(errors, concept));
  validateUniqueIds(errors, lessons, concepts);
  validateConceptLinks(errors, lessons, concepts);
  validateArcs(errors, lessons);

  return errors;
};

const main = async () => {
  const lessons = await readJson(LESSONS_PATH);
  const concepts = await readJson(CONCEPTS_PATH);
  const errors = validateContent(lessons, concepts);

  reportErrorsOrLog(
    errors,
    "Content check failed",
    `Content check passed: ${lessons.length} lessons, ${concepts.length} concepts.`,
  );
};

await main();
