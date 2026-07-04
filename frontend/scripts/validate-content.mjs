import { readFile } from "node:fs/promises";

const LESSONS_PATH = new URL("../src/content/lessons.json", import.meta.url);
const CONCEPTS_PATH = new URL("../src/content/concepts.json", import.meta.url);
const EXPECTED_LESSON_COUNT = 30;
const DIFFICULTIES = new Set(["easy", "medium", "advanced"]);
const VALIDATION_MODES = new Set(["structural", "browser-rust", "self-check"]);
const STRUCTURAL_TYPES = new Set([
  "enum_unit_variants",
  "struct_fields",
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

const isRecord = (value) => typeof value === "object" && value !== null;
const isString = (value) => typeof value === "string" && value.trim().length > 0;
const isNumber = (value) => typeof value === "number" && Number.isFinite(value);
const isStringArray = (value) => Array.isArray(value) && value.every(isString);

const push = (errors, message) => {
  errors.push(message);
};

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

const validateEstimatedMinutes = (errors, lesson) => {
  if (!isNumber(lesson.estimatedMinutes) || lesson.estimatedMinutes < 5 || lesson.estimatedMinutes > 10) {
    push(errors, `${lesson.id} estimatedMinutes must be between 5 and 10.`);
  }
};

const validateNoCompilationPromises = (errors, lesson) => {
  const copy = [lesson.title, ...lesson.hints, lesson.completionExplanation]
    .join(" ")
    .toLowerCase();
  const forbidden = FORBIDDEN_PROMISES.find((phrase) => copy.includes(phrase));

  if (forbidden && lesson.validation?.mode !== "browser-rust") {
    push(errors, `${lesson.id} promises unsupported browser Rust behavior: ${forbidden}.`);
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
  if (!Array.isArray(validation.checks) || validation.checks.length === 0) {
    push(errors, `${lesson.id} structural validation must have checks.`);
    return;
  }

  validation.checks.forEach((check, index) =>
    validateStructuralCheck(errors, check, `${lesson.id}.checks[${index}]`),
  );
};

const validateValidation = (errors, lesson) => {
  const validation = lesson.validation;

  if (!isKnownValidation(validation)) {
    push(errors, `${lesson.id} has invalid validation metadata.`);
    return;
  }

  if (validation.mode === "structural") {
    validateStructuralValidation(errors, lesson, validation);
  }
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
    "starterCode",
    "hints",
    "completionExplanation",
    "validation",
  ];

  validateRequiredFields(errors, `Lesson ${lesson.id ?? "(missing id)"}`, lesson, required);
  validateDifficulty(errors, lesson.id, lesson.difficulty);
  validateEstimatedMinutes(errors, lesson);
  validateHintCount(errors, lesson);
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

  if (!Array.isArray(lessons) || lessons.length !== EXPECTED_LESSON_COUNT) {
    push(errors, `Expected exactly ${EXPECTED_LESSON_COUNT} lessons.`);
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

  if (errors.length > 0) {
    console.error(`Content check failed with ${errors.length} issue(s):`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exit(1);
  }

  console.log(`Content check passed: ${lessons.length} lessons, ${concepts.length} concepts.`);
};

await main();
