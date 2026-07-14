import { push } from "../lib/diagnostics.mjs";
import {
  editablePath,
  readSolution,
  solutionSnapshotSource,
} from "./source-access.mjs";
import { validationSteps } from "./validation-steps.mjs";

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const structuralChecks = (lesson) =>
  validationSteps(lesson.validation)
    .filter((validation) => validation?.mode === "structural")
    .flatMap((validation) => Array.isArray(validation.checks) ? validation.checks : []);

const CUMULATIVE_STRUCTURAL_TYPES = new Set([
  "impl_trait_for_type",
  "derived_trait_for_type",
  "impl_method",
  "function_signature",
]);

const cumulativeStructuralChecks = (lesson) =>
  structuralChecks(lesson).filter((check) => CUMULATIVE_STRUCTURAL_TYPES.has(check.type));

const findBlockStart = (source, keyword, name) => {
  const pattern = new RegExp(`${keyword}\\s+${escapeRegExp(name)}[^\\{]*\\{`);
  const match = pattern.exec(source);

  return match ? match.index + match[0].length - 1 : -1;
};

const updateBraceDepth = (depth, character) => {
  if (character === "{") {
    return depth + 1;
  }

  if (character === "}") {
    return depth - 1;
  }

  return depth;
};

const findMatchingBrace = (source, start) => {
  let depth = 0;

  for (let index = start; index < source.length; index += 1) {
    depth = updateBraceDepth(depth, source[index]);

    if (source[index] === "}" && depth === 0) {
      return index;
    }
  }

  return -1;
};

const findBlockBody = (source, keyword, name) => {
  const start = findBlockStart(source, keyword, name);
  const end = start === -1 ? -1 : findMatchingBrace(source, start);

  return end === -1 ? null : source.slice(start + 1, end);
};

const OPEN_DEPTH_CHARS = new Set(["(", "[", "{", "<"]);
const CLOSE_DEPTH_CHARS = new Set([")", "]", "}", ">"]);

const updateDelimitedDepth = (character, depth) => {
  if (OPEN_DEPTH_CHARS.has(character)) {
    return depth + 1;
  }

  if (CLOSE_DEPTH_CHARS.has(character)) {
    return Math.max(0, depth - 1);
  }

  return depth;
};

const splitTopLevelEntries = (body) => {
  const entries = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < body.length; index += 1) {
    const character = body[index];

    if (character === "," && depth === 0) {
      entries.push(body.slice(start, index));
      start = index + 1;
    } else {
      depth = updateDelimitedDepth(character, depth);
    }
  }

  entries.push(body.slice(start));
  return entries;
};

const findTopLevelColon = (entry) => {
  let depth = 0;

  for (let index = 0; index < entry.length; index += 1) {
    const character = entry[index];

    if (character === ":" && depth === 0) {
      return index;
    }

    depth = updateDelimitedDepth(character, depth);
  }

  return -1;
};

const normalizeWhitespace = (value) => value.replace(/\s+/g, " ").trim();

const STRUCT_FIELD_NAME_PATTERN = /^(?:pub(?:\([^)]*\))?\s+)?([A-Za-z_][A-Za-z0-9_]*)$/;

const structFieldName = (fieldText) =>
  STRUCT_FIELD_NAME_PATTERN.exec(fieldText.trim())?.[1] ?? null;

const parseStructField = (entry) => {
  const colonIndex = findTopLevelColon(entry);

  if (colonIndex < 0) {
    return null;
  }

  const name = structFieldName(entry.slice(0, colonIndex));
  const typeText = normalizeWhitespace(entry.slice(colonIndex + 1).trim());

  return name && typeText ? { name, typeText } : null;
};

const getStructFields = (body) =>
  splitTopLevelEntries(body).map(parseStructField).filter(Boolean);

const hasStructField = (source, structName, field) => {
  const body = findBlockBody(source, "struct", structName);

  if (!body) {
    return false;
  }

  const fields = getStructFields(body);
  const matchedField = fields.find((candidate) => candidate.name === field.name);

  return Boolean(
    matchedField &&
      field.typeIncludes.every((part) => matchedField.typeText.includes(part)),
  );
};

const hasTupleStructTypes = (source, structName, requiredTypes) => {
  const pattern = new RegExp(`struct\\s+${escapeRegExp(structName)}\\s*\\(([^)]*)\\)`);
  const match = pattern.exec(source);

  return Boolean(match) && requiredTypes.every((part) => match[1].includes(part));
};

const hasEnumVariant = (source, enumName, variant) => {
  const body = findBlockBody(source, "enum", enumName);

  return Boolean(body && new RegExp(`\\b${escapeRegExp(variant)}\\b`).test(body));
};

const hasTraitImpl = (source, traitName, typeName) => {
  const genericStart = traitName.indexOf("<");
  const traitPath = genericStart === -1 ? traitName : traitName.slice(0, genericStart);
  const genericSuffix = genericStart === -1 ? "" : traitName.slice(genericStart);
  const traitLeaf = traitPath.includes("::")
    ? `${traitPath.split("::").at(-1)}${genericSuffix}`
    : traitName;
  const pattern = new RegExp(
    `impl(?:\\s*<[^>{}]+>)?\\s+(?:[A-Za-z_][A-Za-z0-9_]*::)*${escapeRegExp(traitLeaf)}(?:\\s*<[^>{}]+>)?\\s+for\\s+[^\\{;]*${escapeRegExp(typeName)}\\b`,
  );

  return pattern.test(source);
};

const declarationWithAttributesPattern = (typeName) =>
  new RegExp(
    `((?:\\s*#\\[[\\s\\S]*?\\]\\s*)*)\\b(?:pub(?:\\([^)]*\\))?\\s+)?(?:struct|enum)\\s+${escapeRegExp(typeName)}\\b`,
  );

const traitLeafName = (traitName) => {
  const parts = traitName.split("::");

  return parts[parts.length - 1] || traitName;
};

const hasDerivedTrait = (source, traitName, typeName) => {
  const declaration = declarationWithAttributesPattern(typeName).exec(source);
  const derivePattern = new RegExp(
    `#\\[\\s*derive\\s*\\([^)]*\\b${escapeRegExp(traitLeafName(traitName))}\\b[^)]*\\)\\s*\\]`,
  );

  return Boolean(declaration && derivePattern.test(declaration[1]));
};

const hasFunctionWithIncludes = (source, functionName, requiredIncludes) => {
  const functionPattern = new RegExp(`fn\\s+${escapeRegExp(functionName)}\\b[^\\{;]*`);
  const match = functionPattern.exec(source);
  const comparableSource = source.replace(/&'[A-Za-z_][A-Za-z0-9_]*\s+/g, "&");

  return Boolean(match) && requiredIncludes.every((part) => comparableSource.includes(part));
};

const hasFunctionSignatureWithIncludes = (
  source,
  functionName,
  requiredIncludes,
) => {
  const functionPattern = new RegExp(
    `(?:pub(?:\\([^)]*\\))?\\s+)?(?:async\\s+)?fn\\s+${escapeRegExp(functionName)}\\b[^\\{;]*`,
  );
  const match = functionPattern.exec(source);
  const comparableSignature =
    match?.[0].replace(/&'[A-Za-z_][A-Za-z0-9_]*\s+/g, "&") ?? "";

  return (
    Boolean(match) &&
    requiredIncludes.every((part) => comparableSignature.includes(part))
  );
};

const solutionSatisfiesCheck = (source, check) => {
  const checks = {
    enum_unit_variants: () =>
      check.requiredVariants.every((variant) => hasEnumVariant(source, check.enumName, variant)),
    struct_fields: () =>
      check.requiredFields.every((field) => hasStructField(source, check.structName, field)),
    tuple_struct_fields: () =>
      hasTupleStructTypes(source, check.structName, check.requiredTypes),
    impl_trait_for_type: () =>
      hasTraitImpl(source, check.traitName, check.typeName),
    derived_trait_for_type: () =>
      hasDerivedTrait(source, check.traitName, check.typeName),
    impl_method: () =>
      hasFunctionWithIncludes(source, check.methodName, check.requiredSignatureIncludes),
    function_signature: () =>
      hasFunctionSignatureWithIncludes(
        source,
        check.functionName,
        check.requiredSignatureIncludes,
      ),
    source_includes: () =>
      check.requiredSnippets.every((snippet) => source.includes(snippet)) &&
      (check.forbiddenSnippets ?? []).every((snippet) => !source.includes(snippet)),
  };

  return checks[check.type]?.() ?? true;
};

const safelySatisfiesCheck = (source, check) => {
  try {
    return solutionSatisfiesCheck(source, check);
  } catch {
    return true;
  }
};

export const validateCurrentStructuralChecksTargetEditableFile = async (
  errors,
  lessonRecord,
) => {
  const { lesson, lessonJsonPath } = lessonRecord;
  const path = editablePath(lesson);

  if (!path) {
    return;
  }

  const solution = await readSolution(lessonJsonPath, lesson);

  for (const check of structuralChecks(lesson)) {
    if (!safelySatisfiesCheck(solution, check)) {
      push(
        errors,
        `${lesson.id} structural check ${check.type} must pass against editable file ${path}.`,
      );
    }
  }
};

export const validateSolutionSatisfiesStructuralChecks = async (
  errors,
  current,
  requiredLessonRecords,
) => {
  const solution = await solutionSnapshotSource(current.lessonJsonPath, current.lesson);

  for (const required of requiredLessonRecords) {
    for (const check of cumulativeStructuralChecks(required.lesson)) {
      if (!safelySatisfiesCheck(solution, check)) {
        push(
          errors,
          `${current.lesson.id} solution must preserve ${required.lesson.id} structural check ${check.type}.`,
        );
      }
    }
  }
};
