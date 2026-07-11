import { readFile, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  COMPILE_FAIL_PREFIX,
  findLessonJsonFiles,
  isCompileFailPath,
  isFixturePath,
  isNumber,
  isRecord,
  isRunnerPath,
  isSafeRelativePath,
  isSourceFilePath,
  isTestdataPath,
  isTestFilePath,
  isString,
  normalizeSource,
  pathExists,
  push,
  readJson,
  reportErrorsOrLog,
  repoRelativePath,
  REQUIRED_LIB_PATH,
  SOURCE_CONCEPTS_PATH,
  TEST_FILE_PATTERN,
  VALID_FILE_ROLES,
  validateHintObject,
  validateKnownDependencySet,
} from "./shared.mjs";

const lessonDir = (lessonJsonPath) => dirname(lessonJsonPath);
const lessonSourcePath = (lessonJsonPath, sourcePath) =>
  join(lessonDir(lessonJsonPath), sourcePath);

const readLessonSource = async (lessonJsonPath, sourcePath) => {
  if (!isSafeRelativePath(sourcePath)) {
    return "";
  }

  try {
    return await readFile(lessonSourcePath(lessonJsonPath, sourcePath), "utf8");
  } catch {
    return "";
  }
};

const validateSourcePathSyntax = (errors, sourcePath, label, fieldName) => {
  if (!isString(sourcePath)) {
    push(errors, `${label} must have ${fieldName}.`);
    return false;
  }

  if (!isSafeRelativePath(sourcePath)) {
    push(errors, `${label} ${fieldName} ${sourcePath} must be normalized, relative, and safe.`);
    return false;
  }

  return true;
};

const readSourcePathStats = async (fullPath) => {
  try {
    return await stat(fullPath);
  } catch {
    return null;
  }
};

const SOURCE_PATH_KIND_VALIDATORS = {
  file: {
    label: "file",
    matches: (pathStats) => pathStats.isFile(),
  },
  directory: {
    label: "directory",
    matches: (pathStats) => pathStats.isDirectory(),
  },
};

const validateSourcePathKind = (
  errors,
  sourcePath,
  label,
  fieldName,
  expectedKind,
  pathStats,
) => {
  const kindValidator = SOURCE_PATH_KIND_VALIDATORS[expectedKind];

  if (kindValidator.matches(pathStats)) {
    return true;
  }

  push(errors, `${label} ${fieldName} ${sourcePath} must reference a ${kindValidator.label}.`);
  return false;
};

const validateSourcePath = async (
  errors,
  lessonJsonPath,
  sourcePath,
  label,
  fieldName = "sourcePath",
  expectedKind = "file",
) => {
  if (!validateSourcePathSyntax(errors, sourcePath, label, fieldName)) {
    return false;
  }

  const fullPath = lessonSourcePath(lessonJsonPath, sourcePath);
  const pathStats = await readSourcePathStats(fullPath);

  if (!pathStats) {
    push(errors, `${label} references missing source path ${sourcePath}.`);
    return false;
  }

  return validateSourcePathKind(
    errors,
    sourcePath,
    label,
    fieldName,
    expectedKind,
    pathStats,
  );
};

const editableFile = (lesson) =>
  Array.isArray(lesson.files)
    ? lesson.files.find((file) => file.role === "editable")
    : null;

const editablePath = (lesson) => editableFile(lesson)?.path ?? null;

const validateEditableFileCount = (errors, lesson) => {
  const editableFiles = lesson.files.filter((file) => file.role === "editable");

  if (editableFiles.length !== 1) {
    push(errors, `${lesson.id} must have exactly one editable file.`);
  }
};

const validateFileRecord = (errors, lesson, file) => {
  if (!isRecord(file) || !isString(file.path) || !isString(file.role)) {
    push(errors, `${lesson.id} has an invalid file entry.`);
    return false;
  }

  return true;
};

const validateFileRole = (errors, lesson, file) => {
  if (!VALID_FILE_ROLES.has(file.role)) {
    push(errors, `${lesson.id} file ${file.path} has invalid role ${file.role}.`);
  }
};

const validateFilePath = (errors, lesson, file) => {
  if (!isSafeRelativePath(file.path)) {
    push(errors, `${lesson.id} file ${file.path} must be normalized, relative, and safe.`);
    return;
  }

  if (!isRunnerPath(file.path)) {
    push(errors, `${lesson.id} file ${file.path} is not supported by the runner.`);
  }
};

const isReadonlySupportPath = (path) => isFixturePath(path) || isTestdataPath(path);

const validateEditablePath = (errors, lesson, file) => {
  if (!isSourceFilePath(file.path)) {
    push(errors, `${lesson.id} editable file ${file.path} must be under src/**/*.rs.`);
  }
};

const validateReadonlyPath = (errors, lesson, file) => {
  if (!isSourceFilePath(file.path) && !isReadonlySupportPath(file.path)) {
    push(
      errors,
      `${lesson.id} readonly file ${file.path} must be under src/**/*.rs, fixtures/**, or testdata/**.`,
    );
  }
};

const validateTestPath = (errors, lesson, file) => {
  if (!isTestFilePath(file.path)) {
    push(errors, `${lesson.id} test file ${file.path} must be under tests/**/*.rs.`);
  }
};

const validateSupportPathRole = (errors, lesson, file) => {
  if (!isReadonlySupportPath(file.path) || file.role === "readonly") {
    return;
  }

  push(errors, `${lesson.id} support file ${file.path} must use readonly role.`);
};

const FILE_ROLE_PATH_VALIDATORS = {
  editable: validateEditablePath,
  readonly: validateReadonlyPath,
  test: validateTestPath,
};

const validateFileRolePath = (errors, lesson, file) => {
  if (!VALID_FILE_ROLES.has(file.role) || !isSafeRelativePath(file.path)) {
    return;
  }

  FILE_ROLE_PATH_VALIDATORS[file.role](errors, lesson, file);
  validateSupportPathRole(errors, lesson, file);
};

const validateFileSource = async (errors, lessonJsonPath, lesson, file) => {
  if (file.content !== undefined) {
    push(errors, `${lesson.id} file ${file.path} must use sourcePath instead of inline content.`);
  }

  await validateSourcePath(errors, lessonJsonPath, file.sourcePath, `${lesson.id} ${file.path}`);
};

const validateFile = async (errors, lessonJsonPath, lesson, file) => {
  if (!validateFileRecord(errors, lesson, file)) {
    return;
  }

  validateFileRole(errors, lesson, file);
  validateFilePath(errors, lesson, file);
  validateFileRolePath(errors, lesson, file);
  await validateFileSource(errors, lessonJsonPath, lesson, file);
};

const validateFiles = async (errors, lessonJsonPath, lesson) => {
  if (!Array.isArray(lesson.files) || lesson.files.length === 0) {
    push(errors, `${lesson.id} must define files.`);
    return;
  }

  validateEditableFileCount(errors, lesson);
  const seenPaths = new Set();

  for (const file of lesson.files) {
    await validateFile(errors, lessonJsonPath, lesson, file);
    validateUniqueFilePath(errors, lesson, seenPaths, file);
  }
};

const validateUniqueFilePath = (errors, lesson, seenPaths, file) => {
  if (!isRecord(file) || !isString(file.path)) {
    return;
  }

  if (seenPaths.has(file.path)) {
    push(errors, `${lesson.id} has duplicate file path ${file.path}.`);
  }

  seenPaths.add(file.path);
};

const validationSteps = (validation) =>
  validation?.mode === "all" && Array.isArray(validation.validations)
    ? validation.validations
    : [validation];

const validationTestFiles = (validation) =>
  Array.isArray(validation.testFiles) ? validation.testFiles : [];

const lessonBackendTestFiles = (lesson) =>
  Array.isArray(lesson.files)
    ? lesson.files.filter((file) => isRecord(file) && isTestFilePath(file.path))
    : [];

const hasBackendTestInput = (lesson, validation) =>
  isString(validation.testCode) ||
  validationTestFiles(validation).length > 0 ||
  lessonBackendTestFiles(lesson).length > 0;

const validateBackendTestPresence = (errors, lesson, validation) => {
  if (!hasBackendTestInput(lesson, validation)) {
    push(errors, `${lesson.id} backend validation must define or include ${TEST_FILE_PATTERN}.`);
  }
};

const validateBackendTestFileSources = async (
  errors,
  lessonJsonPath,
  lesson,
  validation,
) => {
  await Promise.all(
    validationTestFiles(validation).map(async (testFile) => {
      if (!isRecord(testFile) || !isString(testFile.path)) {
        push(errors, `${lesson.id} backend test has invalid file entry.`);
        return;
      }

      validateFilePath(errors, lesson, {
        path: testFile.path,
        role: "test",
      });
      validateFileRolePath(errors, lesson, {
        path: testFile.path,
        role: "test",
      });
      await validateSourcePath(
        errors,
        lessonJsonPath,
        testFile.sourcePath,
        `${lesson.id} backend test ${testFile.path}`,
      );
    }),
  );
};

const validateBackendTestFiles = async (
  errors,
  lessonJsonPath,
  lesson,
  validation,
) => {
  validateBackendTestPresence(errors, lesson, validation);
  await validateBackendTestFileSources(errors, lessonJsonPath, lesson, validation);

  if (
    !lesson.files.some(
      (file) =>
        file.path === REQUIRED_LIB_PATH &&
        (file.role === "editable" || file.role === "readonly"),
    )
  ) {
    push(errors, `${lesson.id} backend validation must include ${REQUIRED_LIB_PATH}.`);
  }
};

const isBackendCargoTestValidation = (validation) =>
  validation?.mode === "backend-cargo-test";

const isBackendCompileFailValidation = (validation) =>
  validation?.mode === "backend-compile-fail";

const compileFailCaseTargetName = (name) => name.replaceAll("-", "_");

const validateCompileFailCaseName = (errors, lesson, name) => {
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(name)) {
    push(
      errors,
      `${lesson.id} compile-fail case ${name} must use only ASCII letters, digits, _, and -.`,
    );
  }
};

const validateDiagnosticSnippets = (errors, lesson, caseName, snippets, label) => {
  if (!Array.isArray(snippets) || snippets.length === 0) {
    push(errors, `${lesson.id} compile-fail case ${caseName} must define ${label}.`);
    return;
  }

  snippets.forEach((snippet) => {
    if (!isString(snippet)) {
      push(errors, `${lesson.id} compile-fail case ${caseName} has invalid ${label}.`);
    }
  });
};

const validateOptionalDiagnosticSnippets = (errors, lesson, caseName, snippets, label) => {
  if (snippets === undefined) {
    return;
  }

  if (!Array.isArray(snippets)) {
    push(errors, `${lesson.id} compile-fail case ${caseName} ${label} must be an array.`);
    return;
  }

  snippets.forEach((snippet) => {
    if (!isString(snippet)) {
      push(errors, `${lesson.id} compile-fail case ${caseName} has invalid ${label}.`);
    }
  });
};

const validateCompileFailCasePath = async (errors, lessonJsonPath, lesson, compileFailCase) => {
  if (!isString(compileFailCase.sourcePath)) {
    push(errors, `${lesson.id} compile-fail case ${compileFailCase.name} must have sourcePath.`);
    return;
  }

  if (!isSafeRelativePath(compileFailCase.sourcePath) || !isCompileFailPath(compileFailCase.sourcePath)) {
    push(
      errors,
      `${lesson.id} compile-fail case ${compileFailCase.name} sourcePath must be under ${COMPILE_FAIL_PREFIX} and end with .rs.`,
    );
    return;
  }

  await validateSourcePath(
    errors,
    lessonJsonPath,
    compileFailCase.sourcePath,
    `${lesson.id} compile-fail case ${compileFailCase.name}`,
  );
};

const validateCompileFailCase = async (
  errors,
  lessonJsonPath,
  lesson,
  compileFailCase,
) => {
  if (!isRecord(compileFailCase) || !isString(compileFailCase.name)) {
    push(errors, `${lesson.id} compile-fail case has invalid name.`);
    return;
  }

  validateCompileFailCaseName(errors, lesson, compileFailCase.name);
  await validateCompileFailCasePath(errors, lessonJsonPath, lesson, compileFailCase);
  validateDiagnosticSnippets(
    errors,
    lesson,
    compileFailCase.name,
    compileFailCase.expectedDiagnostics,
    "expectedDiagnostics",
  );
  validateOptionalDiagnosticSnippets(
    errors,
    lesson,
    compileFailCase.name,
    compileFailCase.forbiddenDiagnostics,
    "forbiddenDiagnostics",
  );
};

const reportDuplicate = (errors, lesson, label, value) => {
  push(errors, `${lesson.id} has duplicate compile-fail ${label} ${value}.`);
};

const validateUniqueCompileFailName = (errors, lesson, state, name) => {
  if (!isString(name)) {
    return;
  }

  const targetName = compileFailCaseTargetName(name);

  if (state.names.has(name)) {
    reportDuplicate(errors, lesson, "case", name);
  }
  if (state.targetNames.has(targetName)) {
    reportDuplicate(errors, lesson, "generated target", targetName);
  }

  state.names.add(name);
  state.targetNames.add(targetName);
};

const validateUniqueCompileFailPath = (errors, lesson, state, sourcePath) => {
  if (!isString(sourcePath)) {
    return;
  }

  if (state.paths.has(sourcePath)) {
    reportDuplicate(errors, lesson, "source", sourcePath);
  }

  state.paths.add(sourcePath);
};

const validateUniqueCompileFailCase = (errors, lesson, state, compileFailCase) => {
  if (!isRecord(compileFailCase)) {
    return;
  }

  validateUniqueCompileFailName(errors, lesson, state, compileFailCase.name);
  validateUniqueCompileFailPath(errors, lesson, state, compileFailCase.sourcePath);
};

const validateUniqueCompileFailCases = (errors, lesson, cases) => {
  const state = {
    names: new Set(),
    paths: new Set(),
    targetNames: new Set(),
  };

  cases.forEach((compileFailCase) => {
    validateUniqueCompileFailCase(errors, lesson, state, compileFailCase);
  });
};

const validationDependencySet = (validation) => validation.dependencySet ?? "std";

const compileFailDependencySetsMatch = (validation, cargoTestValidation) =>
  validationDependencySet(validation) === validationDependencySet(cargoTestValidation);

const reportMissingCargoTestSibling = (errors, lesson) => {
  push(errors, `${lesson.id} backend-compile-fail requires a backend-cargo-test sibling.`);
};

const validateCompileFailDependencySetMatch = (
  errors,
  lesson,
  validation,
  cargoTestValidation,
) => {
  if (!compileFailDependencySetsMatch(validation, cargoTestValidation)) {
    push(
      errors,
      `${lesson.id} backend-compile-fail dependencySet must match backend-cargo-test dependencySet.`,
    );
  }
};

const validateCompileFailSiblingDependencySet = (
  errors,
  lesson,
  validation,
  siblingValidations,
) => {
  const cargoTestValidation = siblingValidations.find(isBackendCargoTestValidation);

  if (cargoTestValidation) {
    validateCompileFailDependencySetMatch(errors, lesson, validation, cargoTestValidation);
  } else {
    reportMissingCargoTestSibling(errors, lesson);
  }
};

const validateCompileFailSibling = (
  errors,
  lesson,
  validation,
  siblingValidations,
) => {
  if (!Array.isArray(siblingValidations)) {
    push(errors, `${lesson.id} backend-compile-fail must be inside all validation.`);
    return;
  }

  validateCompileFailSiblingDependencySet(
    errors,
    lesson,
    validation,
    siblingValidations,
  );
};

const validateCompileFailCases = async (
  errors,
  lessonJsonPath,
  lesson,
  cases,
) => {
  if (!Array.isArray(cases) || cases.length === 0) {
    push(errors, `${lesson.id} backend-compile-fail must define cases.`);
    return;
  }

  validateUniqueCompileFailCases(errors, lesson, cases);
  await Promise.all(
    cases.map((compileFailCase) =>
      validateCompileFailCase(errors, lessonJsonPath, lesson, compileFailCase),
    ),
  );
};

const validateCompileFailValidationStep = async (
  errors,
  lessonJsonPath,
  lesson,
  validation,
  siblingValidations,
) => {
  if (!isBackendCompileFailValidation(validation)) {
    return;
  }

  validateKnownDependencySet(errors, lesson.id, validation);
  validateCompileFailSibling(errors, lesson, validation, siblingValidations);

  await validateCompileFailCases(errors, lessonJsonPath, lesson, validation.cases);
};

const validateBackendValidationStep = async (
  errors,
  lessonJsonPath,
  lesson,
  validation,
) => {
  if (!isBackendCargoTestValidation(validation)) {
    return;
  }

  validateKnownDependencySet(errors, lesson.id, validation);
  await validateBackendTestFiles(errors, lessonJsonPath, lesson, validation);
};

const topLevelValidationSteps = (validation) =>
  validation.mode === "all" && Array.isArray(validation.validations)
    ? validation.validations
    : validationSteps(validation);

const compileFailSiblingValidations = (validation) =>
  validation.mode === "all" && Array.isArray(validation.validations)
    ? validation.validations
    : null;

const validateValidationSteps = async (
  errors,
  lessonJsonPath,
  lesson,
  validations,
  siblingValidations,
) => {
  for (const validation of validations) {
    await validateBackendValidationStep(errors, lessonJsonPath, lesson, validation);
    await validateCompileFailValidationStep(
      errors,
      lessonJsonPath,
      lesson,
      validation,
      siblingValidations,
    );
  }
};

const validateValidation = async (errors, lessonJsonPath, lesson) => {
  if (!isRecord(lesson.validation)) {
    push(errors, `${lesson.id} must define validation.`);
    return;
  }

  await validateValidationSteps(
    errors,
    lessonJsonPath,
    lesson,
    topLevelValidationSteps(lesson.validation),
    compileFailSiblingValidations(lesson.validation),
  );
};

const validateHints = (errors, lesson) => {
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

const validateAuthor = async (errors, lessonJsonPath, lesson) => {
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

const validateRequiredLessonFields = (errors, label, lesson) => {
  for (const field of REQUIRED_LESSON_FIELDS) {
    if (!(field in lesson)) {
      push(errors, `${label} is missing ${field}.`);
    }
  }
};

const validateLessonOrder = (errors, lesson) => {
  if (!isNumber(lesson.order)) {
    push(errors, `${lesson.id} must define numeric order.`);
  }
};

const validateLessonConcept = (errors, lesson, conceptIds) => {
  if (!conceptIds.has(lesson.conceptId)) {
    push(errors, `${lesson.id} references missing concept ${lesson.conceptId}.`);
  }
};

const validateInstructionsNameEditablePath = (errors, lesson) => {
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

const solutionSourcePath = (lesson) =>
  isRecord(lesson.author) && isString(lesson.author.solutionPath) && editablePath(lesson)
    ? `${lesson.author.solutionPath}/${editablePath(lesson)}`
    : null;

const readSolution = async (lessonJsonPath, lesson) => {
  const sourcePath = solutionSourcePath(lesson);

  return sourcePath ? await readLessonSource(lessonJsonPath, sourcePath) : "";
};

const lessonFileByPath = (lesson, path) =>
  Array.isArray(lesson.files)
    ? lesson.files.find((file) => file.path === path)
    : null;

const readLessonFileSource = async (lessonJsonPath, file) =>
  file?.sourcePath ? await readLessonSource(lessonJsonPath, file.sourcePath) : "";

const solutionSnapshotSource = async (lessonJsonPath, lesson) => {
  if (!Array.isArray(lesson.files)) {
    return "";
  }

  const parts = await Promise.all(
    lesson.files
      .filter((file) => file.role !== "test")
      .map(async (file) => {
        const content =
          file.role === "editable"
            ? await readSolution(lessonJsonPath, lesson)
            : await readLessonFileSource(lessonJsonPath, file);

        return `// ${file.path}\n${content}`;
      }),
  );

  return parts.join("\n\n");
};

const FORBIDDEN_CUMULATIVE_SOURCE_SNIPPETS = [
  "previous_lesson_solution",
  "#[allow(dead_code)]",
];

const validateActiveSource = (errors, lesson, label, source) => {
  const forbiddenSnippet = FORBIDDEN_CUMULATIVE_SOURCE_SNIPPETS.find((snippet) =>
    source.includes(snippet),
  );

  if (forbiddenSnippet) {
    push(
      errors,
      `${lesson.id} ${label} must keep previous work active; remove ${forbiddenSnippet}.`,
    );
  }
};

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

const validateCurrentStructuralChecksTargetEditableFile = async (
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

const validateSolutionSatisfiesStructuralChecks = async (
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

const lessonSortKey = (lesson) => [lesson.arcId, lesson.day, lesson.order, lesson.id];

const sortLessonsByArcDay = (lessons) =>
  [...lessons].sort((left, right) => {
    const [leftArc, leftDay, leftOrder, leftId] = lessonSortKey(left.lesson);
    const [rightArc, rightDay, rightOrder, rightId] = lessonSortKey(right.lesson);

    return (
      leftArc.localeCompare(rightArc) ||
      leftDay - rightDay ||
      leftOrder - rightOrder ||
      leftId.localeCompare(rightId)
    );
  });

const cumulativeSourceContext = async (previous, current, previousEditablePath) => ({
  currentFile: lessonFileByPath(current.lesson, previousEditablePath),
  previousSource: normalizeSource(
    await readSolution(previous.lessonJsonPath, previous.lesson),
  ),
});

const validateEditableContinuation = (
  errors,
  previous,
  current,
  path,
  previousSource,
  currentSource,
) => {
  if (currentSource.startsWith(previousSource)) {
    return;
  }

  push(
    errors,
    `${current.lesson.id} editable starter ${path} must begin with previous lesson ${previous.lesson.id} authored source.`,
  );
};

const validateReadonlyContinuation = (
  errors,
  previous,
  current,
  path,
  previousSource,
  currentSource,
) => {
  if (currentSource === previousSource) {
    return;
  }

  push(
    errors,
    `${current.lesson.id} readonly file ${path} must match previous lesson ${previous.lesson.id} authored solution.`,
  );
};

const validateNonEditableContinuation = (
  errors,
  previous,
  current,
  path,
  currentFile,
  previousSource,
  currentSource,
) => {
  if (currentFile.role !== "readonly") {
    push(
      errors,
      `${current.lesson.id} previous editable file ${path} from ${previous.lesson.id} must be readonly when it is not editable.`,
    );
    return;
  }

  validateReadonlyContinuation(
    errors,
    previous,
    current,
    path,
    previousSource,
    currentSource,
  );
};

const validateCumulativeLesson = async (
  errors,
  previous,
  current,
) => {
  const previousEditablePath = editablePath(previous.lesson);

  if (!previousEditablePath) {
    return;
  }

  const { currentFile, previousSource } = await cumulativeSourceContext(
    previous,
    current,
    previousEditablePath,
  );

  if (!currentFile) {
    push(
      errors,
      `${current.lesson.id} must include previous lesson ${previous.lesson.id} editable file ${previousEditablePath}.`,
    );
    return;
  }

  const currentSource = normalizeSource(
    await readLessonFileSource(current.lessonJsonPath, currentFile),
  );

  if (currentFile.role === "editable") {
    validateEditableContinuation(
      errors,
      previous,
      current,
      previousEditablePath,
      previousSource,
      currentSource,
    );
    return;
  }

  validateNonEditableContinuation(
    errors,
    previous,
    current,
    previousEditablePath,
    currentFile,
    previousSource,
    currentSource,
  );
};

const validateNoHistoricalSourceModules = async (errors, lessonRecord) => {
  const starterParts = await Promise.all(
    (lessonRecord.lesson.files ?? [])
      .filter((file) => file.role !== "test")
      .map((file) => readLessonFileSource(lessonRecord.lessonJsonPath, file)),
  );
  const starter = starterParts.join("\n\n");
  const solution = await solutionSnapshotSource(lessonRecord.lessonJsonPath, lessonRecord.lesson);

  validateActiveSource(errors, lessonRecord.lesson, "starter", starter);
  validateActiveSource(errors, lessonRecord.lesson, "solution", solution);
};

const validateCumulativeArcLessons = async (errors, arcLessons) => {
  const ordered = sortLessonsByArcDay(arcLessons);

  await Promise.all(
    ordered.slice(1).map((lesson, index) =>
      validateCumulativeLesson(errors, ordered[index], lesson),
    ),
  );

  await Promise.all(
    ordered.map((lesson) =>
      validateCurrentStructuralChecksTargetEditableFile(errors, lesson),
    ),
  );

  await Promise.all(
    ordered.map((lesson, index) =>
      validateSolutionSatisfiesStructuralChecks(errors, lesson, ordered.slice(0, index + 1)),
    ),
  );
};

const validateCumulativeLessons = async (errors, lessonRecords) => {
  const arcIds = [...new Set(lessonRecords.map(({ lesson }) => lesson.arcId))];

  await Promise.all(
    lessonRecords.map((lessonRecord) =>
      validateNoHistoricalSourceModules(errors, lessonRecord),
    ),
  );

  await Promise.all(
    arcIds.map((arcId) =>
      validateCumulativeArcLessons(
        errors,
        lessonRecords.filter(({ lesson }) => lesson.arcId === arcId),
      ),
    ),
  );
};

const validateLesson = async (errors, lessonJsonPath, conceptIds) => {
  const lesson = await readJson(lessonJsonPath);
  const label = repoRelativePath(lessonJsonPath);

  validateRequiredLessonFields(errors, label, lesson);
  validateLessonOrder(errors, lesson);
  validateLessonConcept(errors, lesson, conceptIds);

  await validateFiles(errors, lessonJsonPath, lesson);
  validateInstructionsNameEditablePath(errors, lesson);
  await validateValidation(errors, lessonJsonPath, lesson);
  validateHints(errors, lesson);
  await validateAuthor(errors, lessonJsonPath, lesson);

  return lesson;
};

const main = async () => {
  const concepts = await pathExists(SOURCE_CONCEPTS_PATH)
    ? await readJson(SOURCE_CONCEPTS_PATH)
    : [];
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const lessonJsonFiles = await findLessonJsonFiles();
  const errors = [];
  const lessonRecords = [];

  for (const lessonJsonPath of lessonJsonFiles) {
    lessonRecords.push({
      lesson: await validateLesson(errors, lessonJsonPath, conceptIds),
      lessonJsonPath,
    });
  }

  await validateCumulativeLessons(errors, lessonRecords);

  const lessons = lessonRecords.map(({ lesson }) => lesson);
  const duplicateIds = lessons
    .map((lesson) => lesson.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);

  duplicateIds.forEach((id) => push(errors, `Duplicate source lesson id: ${id}.`));

  reportErrorsOrLog(
    errors,
    "Source content check failed",
    `Source content check passed: ${lessons.length} lesson(s).`,
  );
};

await main();
