import { push } from "../lib/diagnostics.mjs";
import { isNumber, isRecord, isString } from "../lib/primitives.mjs";

const REQUIRED_LESSON_FIELDS = [
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

const LESSON_FIELDS = new Set([
  ...REQUIRED_LESSON_FIELDS,
  "files",
  "starterCode",
  "author",
]);
const LESSON_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*-\d{3}$/;
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DIFFICULTIES = new Set(["easy", "medium", "advanced"]);
const isPositiveInteger = (value) => Number.isInteger(value) && value > 0;

const reportUnknownFields = (errors, label, value, allowedFields) => {
  if (!isRecord(value)) {
    return;
  }
  Object.keys(value)
    .filter((field) => !allowedFields.has(field))
    .forEach((field) => push(errors, `${label} has unknown field ${field}.`));
};

const STRUCTURAL_CHECK_FIELDS = {
  enum_unit_variants: ["type", "enumName", "requiredVariants"],
  struct_fields: ["type", "structName", "requiredFields"],
  tuple_struct_fields: ["type", "structName", "requiredTypes"],
  impl_trait_for_type: ["type", "traitName", "typeName"],
  derived_trait_for_type: ["type", "traitName", "typeName"],
  impl_method: ["type", "implFor", "methodName", "requiredSignatureIncludes"],
  function_signature: ["type", "functionName", "requiredSignatureIncludes"],
  source_includes: ["type", "requiredSnippets", "forbiddenSnippets"],
};

const validationFields = (validation) => ({
  all: ["mode", "validations"],
  structural: ["mode", "timeoutMs", "checks"],
  "browser-rust": ["mode", "timeoutMs", "checks"],
  "backend-cargo-test": ["mode", "timeoutMs", "dependencySet", "testCode", "testFiles"],
  "backend-compile-fail": ["mode", "timeoutMs", "dependencySet", "cases"],
  "self-check": ["mode"],
}[validation?.mode]);

const validateStructuralFieldEntries = (errors, label, check) => {
  if (check?.type !== "struct_fields" || !Array.isArray(check.requiredFields)) {
    return;
  }
  check.requiredFields.forEach((field, fieldIndex) =>
    reportUnknownFields(
      errors,
      `${label} field ${fieldIndex + 1}`,
      field,
      new Set(["name", "typeIncludes"]),
    ));
};

const validateStructuralCheckShape = (errors, label, check) => {
  const fields = STRUCTURAL_CHECK_FIELDS[check?.type];
  if (!fields) {
    push(errors, `${label} has unknown type ${String(check?.type)}.`);
    return;
  }
  reportUnknownFields(errors, label, check, new Set(fields));
  validateStructuralFieldEntries(errors, label, check);
};

const validateStructuralCheckShapes = (errors, label, validation) => {
  if (validation?.mode !== "structural" || !Array.isArray(validation.checks)) {
    return;
  }
  validation.checks.forEach((check, index) =>
    validateStructuralCheckShape(errors, `${label} check ${index + 1}`, check));
};

const validateNestedRecords = (errors, label, records, recordLabel, fields) => {
  if (!Array.isArray(records)) {
    return;
  }
  records.forEach((record, index) =>
    reportUnknownFields(errors, `${label} ${recordLabel} ${index + 1}`, record, fields));
};

const validateNestedValidationSteps = (errors, label, validation) => {
  if (validation?.mode !== "all" || !Array.isArray(validation.validations)) {
    return;
  }
  validation.validations.forEach((step, index) =>
    validateStrictValidationShape(errors, `${label} validation ${index + 1}`, step));
};

const VALIDATION_MODES_WITHOUT_TIMEOUT = new Set(["self-check", "all"]);

const validateValidationTimeout = (errors, label, validation) => {
  if (VALIDATION_MODES_WITHOUT_TIMEOUT.has(validation.mode)) {
    return;
  }
  if (!isPositiveInteger(validation.timeoutMs)) {
    push(errors, `${label} timeoutMs must be a positive integer.`);
  }
};

const validateStrictValidationShape = (errors, label, validation) => {
  const allowed = validationFields(validation);
  if (!allowed) {
    push(errors, `${label} has unknown validation mode ${String(validation?.mode)}.`);
    return;
  }
  reportUnknownFields(errors, label, validation, new Set(allowed));
  validateValidationTimeout(errors, label, validation);
  validateNestedValidationSteps(errors, label, validation);
  validateStructuralCheckShapes(errors, label, validation);
  validateNestedRecords(errors, label, validation.testFiles, "test file", new Set(["path", "sourcePath"]));
  validateNestedRecords(
    errors,
    label,
    validation.cases,
    "compile-fail case",
    new Set(["name", "path", "sourcePath", "expectedDiagnostics", "forbiddenDiagnostics"]),
  );
};

const validateLessonIdentifiers = (errors, label, lesson) => {
  if (!isString(lesson.id) || !LESSON_ID_PATTERN.test(lesson.id)) {
    push(errors, `${label} id must be a canonical lowercase lesson slug ending in -NNN.`);
  }
  ["arcId", "conceptId"].forEach((field) => {
    if (!isString(lesson[field]) || !SLUG_PATTERN.test(lesson[field])) {
      push(errors, `${label} ${field} must be a canonical lowercase slug.`);
    }
  });
};

const validateLessonScalars = (errors, label, lesson) => {
  const stringFields = ["arcTitle", "title", "scenario", "instructions", "completionExplanation"];
  stringFields.forEach((field) => {
    if (!isString(lesson[field])) {
      push(errors, `${label} ${field} must be a non-empty string.`);
    }
  });
  ["order", "day", "arcLength", "estimatedMinutes"].forEach((field) => {
    if (!isPositiveInteger(lesson[field])) {
      push(errors, `${label} ${field} must be a positive integer.`);
    }
  });
  if (lesson.schemaVersion !== 1 && lesson.schemaVersion !== 2) {
    push(errors, `${label} schemaVersion must be 1 or 2.`);
  }
  if (!DIFFICULTIES.has(lesson.difficulty)) {
    push(errors, `${label} difficulty is invalid.`);
  }
};

const validateLessonNestedFields = (errors, label, lesson) => {
  validateNestedRecords(errors, label, lesson.files, "file", new Set(["path", "role", "sourcePath"]));
  validateNestedRecords(errors, label, lesson.hints, "hint", new Set(["level", "body", "solutionCode"]));
  reportUnknownFields(errors, `${label} author`, lesson.author, new Set(["solutionPath", "notesPath"]));
  validateStrictValidationShape(errors, `${label} validation`, lesson.validation);
};

export const validateLessonDomain = (errors, label, lesson) => {
  if (!isRecord(lesson)) {
    push(errors, `${label} must be a JSON object.`);
    return;
  }
  reportUnknownFields(errors, label, lesson, LESSON_FIELDS);
  validateLessonIdentifiers(errors, label, lesson);
  validateLessonScalars(errors, label, lesson);
  validateLessonNestedFields(errors, label, lesson);
};

const CONCEPT_FIELDS = new Set([
  "id", "name", "description", "prerequisites", "difficulty", "lessonIds", "tags", "masteryThreshold",
]);

const validateConceptId = (errors, label, concept) => {
  if (!isString(concept.id) || !SLUG_PATTERN.test(concept.id)) {
    push(errors, `${label} id must be a canonical lowercase slug.`);
  }
};

const validateConceptStringFields = (errors, label, concept) => {
  ["name", "description"].forEach((field) => {
    if (!isString(concept[field])) {
      push(errors, `${label} ${field} must be a non-empty string.`);
    }
  });
};

const validateConceptArrayFields = (errors, label, concept) => {
  ["prerequisites", "lessonIds", "tags"].forEach((field) => {
    if (!Array.isArray(concept[field]) || !concept[field].every(isString)) {
      push(errors, `${label} ${field} must contain strings.`);
    }
  });
};

const validateConceptDifficulty = (errors, label, concept) => {
  if (!Array.isArray(concept.difficulty) || !concept.difficulty.every((item) => DIFFICULTIES.has(item))) {
    push(errors, `${label} difficulty is invalid.`);
  }
};

const validateConceptMasteryThreshold = (errors, label, concept) => {
  if (!isPositiveInteger(concept.masteryThreshold)) {
    push(errors, `${label} masteryThreshold must be a positive integer.`);
  }
};

const validateConceptScalars = (errors, label, concept) => {
  validateConceptId(errors, label, concept);
  validateConceptStringFields(errors, label, concept);
  validateConceptArrayFields(errors, label, concept);
  validateConceptDifficulty(errors, label, concept);
  validateConceptMasteryThreshold(errors, label, concept);
};

export const validateConceptDomain = (errors, concept, index) => {
  const label = `Concept ${index + 1}`;
  reportUnknownFields(errors, label, concept, CONCEPT_FIELDS);
  if (!isRecord(concept)) {
    push(errors, `${label} must be a JSON object.`);
    return;
  }
  validateConceptScalars(errors, label, concept);
};

export const validateRequiredLessonFields = (errors, label, lesson) => {
  for (const field of REQUIRED_LESSON_FIELDS) {
    if (!(field in lesson)) {
      push(errors, `${label} is missing ${field}.`);
    }
  }
};

export const validateLessonOrder = (errors, lesson) => {
  if (!isNumber(lesson.order)) {
    push(errors, `${lesson.id} must define numeric order.`);
  }
};

export const validateLessonConcept = (errors, lesson, conceptIds) => {
  if (!conceptIds.has(lesson.conceptId)) {
    push(errors, `${lesson.id} references missing concept ${lesson.conceptId}.`);
  }
};
