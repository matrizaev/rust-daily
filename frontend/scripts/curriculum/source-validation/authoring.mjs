import { push } from "../lib/diagnostics.mjs";
import { validateHintObject } from "../lib/lesson-helpers.mjs";
import { isRecord, isString, normalizeSource } from "../lib/primitives.mjs";
import { REQUIRED_LIB_PATH } from "../lib/path-rules.mjs";
import {
  editablePath,
  readLessonFileSource,
  readSolution,
  validateSourcePath,
} from "./source-access.mjs";

export const validateHints = (errors, lesson) => {
  if (!Array.isArray(lesson.hints) || lesson.hints.length < 1 || lesson.hints.length > 3) {
    push(errors, `${lesson.id} must have 1-3 hints.`);
    return;
  }

  lesson.hints.forEach((hint, index) =>
    validateHintObject(errors, lesson.id, hint, index),
  );
};

const finalHint = (lesson) =>
  Array.isArray(lesson.hints) ? lesson.hints[lesson.hints.length - 1] : null;

const validateHintSolutionPlacement = (errors, lesson) => {
  if (!Array.isArray(lesson.hints)) {
    return;
  }

  lesson.hints.forEach((hint, index) => {
    if (!isRecord(hint)) {
      return;
    }

    const hasSolutionCode = Object.hasOwn(hint, "solutionCode");
    const isFinalHint = index === lesson.hints.length - 1;

    if (hasSolutionCode && !isFinalHint) {
      push(errors, `${lesson.id} hint ${index + 1} must not define solutionCode.`);
    }
  });
};

export const validateAuthor = async (errors, lessonJsonPath, lesson) => {
  if (!isRecord(lesson.author)) {
    push(errors, `${lesson.id} must define author metadata.`);
    return;
  }

  await validateSourcePath(
    errors,
    lessonJsonPath,
    lesson.author.notesPath,
    `${lesson.id} author`,
    "notesPath",
  );
  await validateAuthorSolutionRoot(errors, lessonJsonPath, lesson);
  await validateEditableSolution(errors, lessonJsonPath, lesson);
  await validateFinalHintSolution(errors, lessonJsonPath, lesson);
};

const validateAuthorSolutionRoot = async (errors, lessonJsonPath, lesson) => {
  if (!isString(lesson.author.solutionPath)) {
    push(errors, `${lesson.id} must define author.solutionPath.`);
    return;
  }

  await validateSourcePath(
    errors,
    lessonJsonPath,
    lesson.author.solutionPath,
    `${lesson.id} author`,
    "solutionPath",
    "directory",
  );
};

const validateEditableSolution = async (errors, lessonJsonPath, lesson) => {
  const path = editablePath(lesson);

  if (!path || !isString(lesson.author.solutionPath)) {
    return;
  }

  const solutionPath = `${lesson.author.solutionPath}/${path}`;

  if (
    !(await validateSourcePath(
      errors,
      lessonJsonPath,
      solutionPath,
      `${lesson.id} editable file ${path}`,
      "solutionPath",
    ))
  ) {
    push(errors, `${lesson.id} editable file ${path} must have a matching solution file.`);
  }
};

const hintHasStringSolution = (hint) => {
  if (!isRecord(hint)) {
    return false;
  }

  return Object.hasOwn(hint, "solutionCode") && typeof hint.solutionCode === "string";
};

const lessonHasAuthorSolutionRoot = (lesson) => {
  if (!isRecord(lesson.author)) {
    return false;
  }

  return isString(lesson.author.solutionPath);
};

const canCompareFinalHintSolution = (lesson, hint) =>
  [
    hintHasStringSolution(hint),
    Boolean(editablePath(lesson)),
    lessonHasAuthorSolutionRoot(lesson),
  ].every(Boolean);

const validateFinalHintHasSolution = (errors, lesson, hint) => {
  if (isRecord(hint) && hintHasStringSolution(hint)) {
    return true;
  }

  if (isRecord(hint)) {
    push(errors, `${lesson.id} final hint must define solutionCode.`);
  }

  return false;
};

const validateFinalHintSolution = async (errors, lessonJsonPath, lesson) => {
  const hint = finalHint(lesson);

  validateHintSolutionPlacement(errors, lesson);

  if (!validateFinalHintHasSolution(errors, lesson, hint)) {
    return;
  }

  if (!canCompareFinalHintSolution(lesson, hint)) {
    return;
  }

  const solution = await readSolution(lessonJsonPath, lesson);
  const path = editablePath(lesson);

  if (normalizeSource(hint.solutionCode) !== normalizeSource(solution)) {
    push(
      errors,
      `${lesson.id} final hint solutionCode must match author solution for ${path}.`,
    );
  }
};

export const validateInstructionsNameEditablePath = (errors, lesson) => {
  const path = editablePath(lesson);

  if (!editablePathRequiresInstructionMention(path)) {
    return;
  }

  if (instructionsMissEditablePath(lesson, path)) {
    push(errors, `${lesson.id} instructions must name editable file ${path}.`);
  }
};

const editablePathRequiresInstructionMention = (path) => {
  if (!path) {
    return false;
  }

  return path !== REQUIRED_LIB_PATH;
};

const instructionsMissEditablePath = (lesson, path) => {
  if (!isString(lesson.instructions)) {
    return false;
  }

  return !lesson.instructions.includes(path);
};

const AUTHOR_PLACEHOLDER = "TODO(author):";
const REAL_WORLD_CONTEXT_TERMS = [
  "config",
  "configuration",
  "request",
  "response",
  "service",
  "repository",
  "adapter",
  "parser",
  "log",
  "logs",
  "logging",
  "event",
  "events",
  "command",
  "inventory",
  "user",
  "money",
  "email",
  "host",
  "hosts",
  "port",
  "ports",
  "retry",
  "timeout",
  "validation",
  "persistence",
  "boundary",
  "business",
  "domain",
  "dto",
  "api",
  "database",
  "http",
  "ui",
  "collection",
  "wrapper",
  "dashboard",
  "address",
  "system",
  "amount",
  "currency",
  "order",
  "codebase",
  "loader",
  "line",
  "failure",
  "failures",
  "error",
  "errors",
  "classification",
  "application",
  "caller",
  "callers",
  "network",
  "endpoint",
  "form",
  "forms",
  "price",
  "prices",
  "decimal",
  "builder",
  "default",
  "field",
  "fields",
  "operator",
  "operators",
  "case",
  "cases",
  "formatting",
  "behavior",
  "doc",
  "example",
  "usage",
  "input",
  "inputs",
  "test",
  "fixture",
];

const hasAuthorPlaceholder = (value) =>
  typeof value === "string" && value.includes(AUTHOR_PLACEHOLDER);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const textIncludesWord = (text, word) =>
  new RegExp(`\\b${escapeRegExp(word)}\\b`, "i").test(text);

const validateScenarioRealWorldFit = (errors, lesson) => {
  if (!isString(lesson.scenario) || hasAuthorPlaceholder(lesson.scenario)) {
    return;
  }

  const hasContext = REAL_WORLD_CONTEXT_TERMS.some((term) =>
    textIncludesWord(lesson.scenario, term),
  );

  if (!hasContext) {
    push(
      errors,
      `${lesson.id} scenario must describe plausible project work; include a concrete service, boundary, data, validation, or test context.`,
    );
  }
};

const publicSymbolsFromSource = (source) => {
  const symbols = new Set();
  const declarationPattern = /\bpub\s+(?:async\s+)?(?:struct|enum|trait|fn)\s+([A-Za-z_][A-Za-z0-9_]*)/g;
  const domainIdentifierPattern = /\b[A-Z][A-Za-z0-9_]+\b/g;
  let match = declarationPattern.exec(source);

  while (match) {
    symbols.add(match[1]);
    match = declarationPattern.exec(source);
  }

  match = domainIdentifierPattern.exec(source);

  while (match) {
    symbols.add(match[0]);
    match = domainIdentifierPattern.exec(source);
  }

  return [...symbols];
};

const INSTRUCTION_ALIGNMENT_TERMS = [
  "assert",
  "check",
  "constructor",
  "derive",
  "field",
  "function",
  "impl",
  "match",
  "method",
  "module",
  "test",
  "trait",
  "variant",
];

const instructionsNameWorkShape = (instructions) =>
  INSTRUCTION_ALIGNMENT_TERMS.some((term) => textIncludesWord(instructions, term));

const lessonProjectSource = async (lessonJsonPath, lesson) => {
  const fileSources = await Promise.all(
    (lesson.files ?? [])
      .filter((file) => file.role !== "test")
      .map((file) => readLessonFileSource(lessonJsonPath, file)),
  );

  return [
    ...fileSources,
    await readSolution(lessonJsonPath, lesson),
  ].join("\n\n");
};

const shouldSkipInstructionApiAlignment = (lesson) =>
  !isString(lesson.instructions) || hasAuthorPlaceholder(lesson.instructions);

const instructionsReferenceKnownApi = (instructions, symbols) =>
  symbols.some((symbol) => instructions.includes(symbol));

const instructionsHaveKnownWorkShape = (instructions, symbols) =>
  symbols.length === 0 ||
  instructionsReferenceKnownApi(instructions, symbols) ||
  instructionsNameWorkShape(instructions);

const needsInstructionApiAlignmentError = async (lessonJsonPath, lesson) => {
  if (shouldSkipInstructionApiAlignment(lesson)) {
    return false;
  }

  const source = await lessonProjectSource(lessonJsonPath, lesson);
  const symbols = publicSymbolsFromSource(source);

  return !instructionsHaveKnownWorkShape(lesson.instructions, symbols);
};

const validateInstructionApiAlignment = async (errors, lessonJsonPath, lesson) => {
  if (await needsInstructionApiAlignmentError(lessonJsonPath, lesson)) {
    push(
      errors,
      `${lesson.id} instructions must name at least one public API/type/function from the starter or expected solution.`,
    );
  }
};

export const validateRealWorldFit = async (errors, lessonJsonPath, lesson) => {
  validateScenarioRealWorldFit(errors, lesson);
  await validateInstructionApiAlignment(errors, lessonJsonPath, lesson);
};
