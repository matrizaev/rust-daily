import {
  COMPILE_FAIL_PREFIX,
  isCompileFailPath,
  isSafeRelativePath,
  isTestFilePath,
  REQUIRED_LIB_PATH,
  TEST_FILE_PATTERN,
} from "../lib/path-rules.mjs";
import {
  push,
  validateDiagnosticAggregateByteLimit,
  validateDiagnosticSnippetLimits,
  validateKnownDependencySet,
} from "../lib/diagnostics.mjs";
import { isRecord, isString } from "../lib/primitives.mjs";
import {
  validateFilePath,
  validateFileRolePath,
} from "./files.mjs";
import { validateSourcePath } from "./source-access.mjs";

export const validationSteps = (validation) =>
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

const validateCompileFailDiagnosticLimits = (errors, lesson, compileFailCase) => {
  const expected = Array.isArray(compileFailCase.expectedDiagnostics)
    ? compileFailCase.expectedDiagnostics
    : [];
  const forbidden = Array.isArray(compileFailCase.forbiddenDiagnostics)
    ? compileFailCase.forbiddenDiagnostics
    : [];
  const label = `${lesson.id} compile-fail case ${compileFailCase.name}`;
  validateDiagnosticSnippetLimits(errors, label, expected, forbidden);
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

  validateCompileFailDiagnosticLimits(errors, lesson, compileFailCase);
};

const compileFailCaseDiagnostics = (compileFailCase) => {
  if (!isRecord(compileFailCase)) {
    return [];
  }

  return [
    ...(Array.isArray(compileFailCase.expectedDiagnostics)
      ? compileFailCase.expectedDiagnostics
      : []),
    ...(Array.isArray(compileFailCase.forbiddenDiagnostics)
      ? compileFailCase.forbiddenDiagnostics
      : []),
  ];
};

const validateCompileFailDiagnosticAggregateLimits = (errors, lesson, cases) => {
  const snippets = cases.flatMap(compileFailCaseDiagnostics);

  validateDiagnosticAggregateByteLimit(
    errors,
    `${lesson.id} compile-fail validation`,
    snippets,
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
  validateCompileFailDiagnosticAggregateLimits(errors, lesson, cases);
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

export const validateValidation = async (errors, lessonJsonPath, lesson) => {
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
