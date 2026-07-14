import { push } from "./diagnostics.mjs";
import { isRecord, isString } from "./primitives.mjs";

export const lessonStarterCode = (lesson) => {
  if (lesson.starterCode !== undefined) {
    return lesson.starterCode;
  }
  return lesson.files?.find((file) => file.role === "editable")?.content ?? "";
};

const recordOrder = (record) =>
  Number.isFinite(record.orderStart) ? record.orderStart : record.order ?? 0;

const compareRecordsByOrderThenId = (left, right) =>
  recordOrder(left) - recordOrder(right) || left.id.localeCompare(right.id);

export const sortRecordsByOrderThenId = (records) =>
  [...records].sort(compareRecordsByOrderThenId);

export const sortRecordsById = (records) =>
  [...records].sort((left, right) => left.id.localeCompare(right.id));

export const duplicateValues = (values) => {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  });

  return [...duplicates];
};

const hintObjectKind = (allowString) =>
  allowString ? "a string or object" : "an object";

const validateHintShape = (errors, lessonId, hint, index, allowString) => {
  if (allowString && typeof hint === "string") {
    return false;
  }

  if (!isRecord(hint)) {
    push(errors, `${lessonId} hint ${index + 1} must be ${hintObjectKind(allowString)}.`);
    return false;
  }

  return true;
};

const validateHintLevel = (errors, lessonId, hint, index) => {
  if (hint.level !== index + 1) {
    push(errors, `${lessonId} hint ${index + 1} must use level ${index + 1}.`);
  }
};

const validateHintBody = (errors, lessonId, hint, index) => {
  if (!isString(hint.body)) {
    push(errors, `${lessonId} hint ${index + 1} must have body.`);
  }
};

const validateHintSolution = (errors, lessonId, hint, index) => {
  if ("solutionCode" in hint && typeof hint.solutionCode !== "string") {
    push(errors, `${lessonId} hint ${index + 1} solutionCode must be a string.`);
  }
};

export const validateHintObject = (
  errors,
  lessonId,
  hint,
  index,
  { allowString = false } = {},
) => {
  if (!validateHintShape(errors, lessonId, hint, index, allowString)) {
    return;
  }

  validateHintLevel(errors, lessonId, hint, index);
  validateHintBody(errors, lessonId, hint, index);
  validateHintSolution(errors, lessonId, hint, index);
};
