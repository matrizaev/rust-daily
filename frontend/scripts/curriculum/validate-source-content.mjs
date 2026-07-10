import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  findLessonJsonFiles,
  isNumber,
  isRecord,
  isString,
  pathExists,
  push,
  readJson,
  reportErrorsOrLog,
  repoRelativePath,
  SOURCE_CONCEPTS_PATH,
  validateHintObject,
  validateKnownDependencySet,
} from "./shared.mjs";

const lessonDir = (lessonJsonPath) => dirname(lessonJsonPath);
const lessonSourcePath = (lessonJsonPath, sourcePath) =>
  join(lessonDir(lessonJsonPath), sourcePath);
const readLessonSource = async (lessonJsonPath, sourcePath) =>
  readFile(lessonSourcePath(lessonJsonPath, sourcePath), "utf8");

const validateSourcePath = async (errors, lessonJsonPath, sourcePath, label) => {
  if (!isString(sourcePath)) {
    push(errors, `${label} must have sourcePath.`);
    return;
  }

  const fullPath = lessonSourcePath(lessonJsonPath, sourcePath);

  if (!(await pathExists(fullPath))) {
    push(errors, `${label} references missing file ${sourcePath}.`);
  }
};

const VALID_FILE_ROLES = new Set(["editable", "readonly", "test"]);
const REQUIRED_LIB_PATH = "src/lib.rs";
const TEST_FILE_PATTERN = "tests/**/*.rs";
const COMPILE_FAIL_PREFIX = "compile_fail/";

const editableFile = (lesson) =>
  Array.isArray(lesson.files)
    ? lesson.files.find((file) => file.role === "editable")
    : null;

const editablePath = (lesson) => editableFile(lesson)?.path ?? null;

const isTestFilePath = (path) => path.startsWith("tests/") && path.endsWith(".rs");

const isSourceFilePath = (path) => path.startsWith("src/") && path.endsWith(".rs");
const isFixturePath = (path) => path.startsWith("fixtures/");
const isTestdataPath = (path) => path.startsWith("testdata/");
const isRunnerPath = (path) =>
  [isSourceFilePath, isTestFilePath, isFixturePath, isTestdataPath].some((matches) =>
    matches(path),
  );
const isCompileFailPath = (path) =>
  path.startsWith(COMPILE_FAIL_PREFIX) && path.endsWith(".rs");

const hasUnsafePathComponent = (path) =>
  path.split("/").some((component) => component === "" || component === "." || component === "..");

const unsafePathPredicates = [
  (path) => path.startsWith("/"),
  (path) => path.includes("\\"),
  (path) => path.includes("\0"),
  (path) => path.endsWith("/"),
  hasUnsafePathComponent,
];

const hasUnsafePathSyntax = (path) =>
  unsafePathPredicates.some((isUnsafe) => isUnsafe(path));

const isSafeRelativePath = (path) => isString(path) && !hasUnsafePathSyntax(path);

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

const validateFileSource = async (errors, lessonJsonPath, lesson, file) => {
  if (file.content === undefined) {
    await validateSourcePath(errors, lessonJsonPath, file.sourcePath, `${lesson.id} ${file.path}`);
  }
};

const validateFile = async (errors, lessonJsonPath, lesson, file) => {
  if (!validateFileRecord(errors, lesson, file)) {
    return;
  }

  validateFileRole(errors, lesson, file);
  validateFilePath(errors, lesson, file);
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

  if (!lesson.files.some((file) => file.path === REQUIRED_LIB_PATH)) {
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

const validateAuthor = async (errors, lessonJsonPath, lesson) => {
  if (!isRecord(lesson.author)) {
    push(errors, `${lesson.id} must define author metadata.`);
    return;
  }

  await validateSourcePath(errors, lessonJsonPath, lesson.author.notesPath, `${lesson.id} notes`);
  await validateAuthorSolutionRoot(errors, lessonJsonPath, lesson);
  await validateEditableSolution(errors, lessonJsonPath, lesson);
};

const validateAuthorSolutionRoot = async (errors, lessonJsonPath, lesson) => {
  if (!isString(lesson.author.solutionPath)) {
    push(errors, `${lesson.id} must define author.solutionPath.`);
    return;
  }

  if (!(await pathExists(lessonSourcePath(lessonJsonPath, lesson.author.solutionPath)))) {
    push(errors, `${lesson.id} references missing solutionPath.`);
  }
};

const validateEditableSolution = async (errors, lessonJsonPath, lesson) => {
  const path = editablePath(lesson);

  if (!path || !isString(lesson.author.solutionPath)) {
    return;
  }

  const solutionPath = join(lesson.author.solutionPath, path);

  if (!(await pathExists(lessonSourcePath(lessonJsonPath, solutionPath)))) {
    push(errors, `${lesson.id} editable file ${path} must have a matching solution file.`);
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

const solutionSourcePath = (lesson) =>
  isRecord(lesson.author) && isString(lesson.author.solutionPath) && editablePath(lesson)
    ? join(lesson.author.solutionPath, editablePath(lesson))
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

const readStarterFileByPath = async (lessonJsonPath, lesson, path) =>
  readLessonFileSource(lessonJsonPath, lessonFileByPath(lesson, path));

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

const normalizedSource = (source) => source.trim().replace(/\r\n/g, "\n");

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

const starterBeginsWithPreviousSolution = (starter, previousSolution) =>
  normalizedSource(previousSolution).length > 0 &&
  normalizedSource(starter).startsWith(normalizedSource(previousSolution));

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

const hasStructField = (source, structName, field) => {
  const body = findBlockBody(source, "struct", structName);

  if (!body) {
    return false;
  }

  const fieldPattern = new RegExp(`${escapeRegExp(field.name)}\\s*:\\s*([^,\\n]+)`);
  const match = fieldPattern.exec(body);

  return Boolean(match) && field.typeIncludes.every((part) => match[1].includes(part));
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

const validateSolutionSatisfiesStructuralChecks = async (
  errors,
  current,
  requiredLessonRecords,
) => {
  const solution = await solutionSnapshotSource(current.lessonJsonPath, current.lesson);

  for (const required of requiredLessonRecords) {
    for (const check of cumulativeStructuralChecks(required.lesson)) {
      if (!solutionSatisfiesCheck(solution, check)) {
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

const validateCumulativeLesson = async (
  errors,
  previous,
  current,
) => {
  const previousSolution = await readSolution(previous.lessonJsonPath, previous.lesson);
  const previousEditablePath = editablePath(previous.lesson);
  const currentStarter = previousEditablePath
    ? await readStarterFileByPath(
        current.lessonJsonPath,
        current.lesson,
        previousEditablePath,
      )
    : "";

  if (!starterBeginsWithPreviousSolution(currentStarter, previousSolution)) {
    push(
      errors,
      `${current.lesson.id} starter must include previous lesson ${previous.lesson.id} solution at ${previousEditablePath ?? "the editable path"}.`,
    );
  }
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
