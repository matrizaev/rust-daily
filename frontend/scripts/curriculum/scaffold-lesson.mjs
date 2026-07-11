import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  KNOWN_DEPENDENCY_SETS,
  LESSONS_ROOT,
  REQUIRED_LIB_PATH,
  SOURCE_ARCS_PATH,
  SOURCE_CONCEPTS_PATH,
  duplicateValues,
  findLessonJsonFiles,
  isCompileFailPath,
  isRecord,
  isRunnerPath,
  isSafeRelativePath,
  isString,
  isTestFilePath,
  pathExists,
  readJson,
  repoRelativePath,
  sortRecordsById,
  sortRecordsByOrderThenId,
  writeJsonFile,
} from "./shared.mjs";

const PLACEHOLDER_MARKER = "TODO(author):";
const DEFAULT_TEST_PATH = "tests/public.rs";
const VALID_DIFFICULTIES = new Set(["easy", "medium", "advanced"]);
const ARC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const BOOLEAN_FLAGS = new Set(["--structural", "--register-arc", "--register-concept", "--force"]);
const VALUE_FLAGS = new Map([
  ["--arc", "arc"],
  ["--lesson", "lesson"],
  ["--title", "title"],
  ["--concept", "concept"],
  ["--difficulty", "difficulty"],
  ["--dependency-set", "dependencySet"],
  ["--editable", "editable"],
  ["--estimated-minutes", "estimatedMinutes"],
  ["--arc-title", "arcTitle"],
  ["--arc-pillar", "arcPillar"],
  ["--arc-description", "arcDescription"],
  ["--arc-length", "arcLength"],
  ["--readonly", "readonly"],
  ["--test", "tests"],
  ["--compile-fail", "compileFail"],
  ["--preset", "preset"],
]);
const REPEATABLE_KEYS = new Set(["readonly", "tests", "compileFail"]);

const ADVANCED_PRESETS = {
  "advanced-owned-api": {
    structural: true,
  },
  "advanced-borrowed-api": {
    structural: true,
  },
  "advanced-async-port": {
    dependencySet: "advanced",
    structural: true,
    testTemplate: "tokio",
  },
  "advanced-actix-boundary": {
    dependencySet: "advanced",
    structural: true,
    testTemplate: "actix",
  },
  "advanced-error-mapping": {
    dependencySet: "advanced",
    structural: true,
  },
  "advanced-property-test": {
    dependencySet: "advanced",
    testTemplate: "proptest",
  },
  "advanced-compile-fail": {
    structural: true,
    compileFailCases: ["public-contract"],
  },
};

const emptyOptions = () => ({
  readonly: [],
  tests: [],
  compileFail: [],
  structural: false,
  registerArc: false,
  registerConcept: false,
  force: false,
});

const flagToBooleanKey = (flag) =>
  flag
    .slice(2)
    .replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase());

const readFlagValue = (argv, index, arg, errors) => {
  const value = argv[index + 1];

  if (value === undefined || value.startsWith("--")) {
    errors.push(`${arg} requires a value.`);
    return null;
  }

  return value;
};

const applyValueOption = (options, key, value, arg, errors) => {
  if (REPEATABLE_KEYS.has(key)) {
    options[key].push(value);
    return;
  }

  if (options[key] === undefined) {
    options[key] = value;
    return;
  }

  errors.push(`${arg} can be provided only once.`);
};

const parseFlagArg = (argv, index, options, errors) => {
  const arg = argv[index];

  if (!arg.startsWith("--")) {
    errors.push(`Unexpected positional argument ${arg}.`);
    return index;
  }

  if (BOOLEAN_FLAGS.has(arg)) {
    options[flagToBooleanKey(arg)] = true;
    return index;
  }

  return parseValueFlagArg(argv, index, options, errors);
};

const parseValueFlagArg = (argv, index, options, errors) => {
  const arg = argv[index];
  const key = VALUE_FLAGS.get(arg);

  if (!key) {
    errors.push(`Unknown flag ${arg}.`);
    return index;
  }

  const value = readFlagValue(argv, index, arg, errors);

  if (value === null) {
    return index;
  }

  applyValueOption(options, key, value, arg, errors);
  return index + 1;
};

const parseArgs = (argv) => {
  const options = emptyOptions();
  const errors = [];

  for (let index = 0; index < argv.length; index += 1) {
    index = parseFlagArg(argv, index, options, errors);
  }

  return { options, errors };
};

const parsePositiveInteger = (value, label, errors, defaultValue = null) => {
  if (value === undefined) {
    return defaultValue;
  }

  if (!/^[1-9][0-9]*$/.test(String(value))) {
    errors.push(`${label} must be a positive integer.`);
    return defaultValue;
  }

  return Number.parseInt(value, 10);
};

const requireStringOption = (options, key, flag, errors) => {
  if (!isString(options[key])) {
    errors.push(`${flag} is required.`);
  }
};

const validateRequiredOptions = (options, errors) => {
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

const unique = (values) => [...new Set(values)];

const caseFileName = (name) => `${name.replaceAll("-", "_")}.rs`;

const compileFailCasePath = (name) => `compile_fail/${caseFileName(name)}`;

const readExistingLessons = async () => {
  const lessonJsonFiles = await findLessonJsonFiles();
  const records = await Promise.all(
    lessonJsonFiles.map(async (jsonPath) => ({
      jsonPath,
      dir: dirname(jsonPath),
      lesson: await readJson(jsonPath),
    })),
  );

  return records;
};

const byId = (records) => new Map(records.map((record) => [record.id, record]));

const maxLessonOrder = (lessons) =>
  lessons.reduce(
    (max, record) =>
      Number.isFinite(record.lesson.order) ? Math.max(max, record.lesson.order) : max,
    0,
  );

const targetExistingRecord = (records, lessonDir, lessonId) =>
  records.find((record) => record.dir === lessonDir || record.lesson.id === lessonId) ?? null;

const lessonsInArc = (records, arcId, targetRecord = null) =>
  records
    .filter((record) => record.lesson.arcId === arcId && record !== targetRecord)
    .sort((left, right) => left.lesson.day - right.lesson.day || left.lesson.order - right.lesson.order);

const projectFiles = (lesson) =>
  Array.isArray(lesson.files)
    ? lesson.files.filter((file) => file.role !== "test" && isString(file.path))
    : [];

const lessonFileByPath = (lesson, path) =>
  projectFiles(lesson).find((file) => file.path === path) ?? null;

const existingPathOrNull = async (path) =>
  (await pathExists(path)) ? path : null;

const previousSolutionSnapshotPath = (previousLessonRecord, path) =>
  join(previousLessonRecord.dir, "solution", path);

const previousStarterSnapshotPath = (previousLessonRecord, path) => {
  const previousFile = lessonFileByPath(previousLessonRecord.lesson, path);

  return previousFile?.sourcePath
    ? join(previousLessonRecord.dir, previousFile.sourcePath)
    : null;
};

const previousSnapshotSourcePath = async (previousLessonRecord, path) => {
  if (!previousLessonRecord) {
    return null;
  }

  const solutionPath = await existingPathOrNull(
    previousSolutionSnapshotPath(previousLessonRecord, path),
  );

  if (solutionPath) {
    return solutionPath;
  }

  const starterPath = previousStarterSnapshotPath(previousLessonRecord, path);

  if (!starterPath) {
    return null;
  }

  return existingPathOrNull(starterPath);
};

const previousProjectPaths = (previousLessonRecord) =>
  previousLessonRecord ? projectFiles(previousLessonRecord.lesson).map((file) => file.path) : [];

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

const defaultPresetOptions = (options) => ({
  ...options,
  testTemplate: "default",
  readonly: unique(options.readonly),
  compileFail: unique(options.compileFail),
});

const validatePresetDependencySet = (options, preset, errors) => {
  if (preset.dependencySet && options.dependencySet !== preset.dependencySet) {
    errors.push(`${options.preset} requires dependency set ${preset.dependencySet}.`);
  }
};

const presetCompileFailCases = (options, preset) =>
  options.compileFail.length > 0 ? [] : preset.compileFailCases ?? [];

const applyKnownPreset = (options, preset, errors) => {
  validatePresetDependencySet(options, preset, errors);

  return {
    ...options,
    structural: options.structural || Boolean(preset.structural),
    readonly: unique([...(preset.readonly ?? []), ...options.readonly]),
    compileFail: unique([...presetCompileFailCases(options, preset), ...options.compileFail]),
    testTemplate: preset.testTemplate ?? "default",
  };
};

const reportUnknownPreset = (options, errors) => {
  errors.push(`Unknown preset ${options.preset}.`);

  return { ...options, testTemplate: "default" };
};

const applyPreset = (options, errors) => {
  if (!options.preset) {
    return defaultPresetOptions(options);
  }

  const preset = ADVANCED_PRESETS[options.preset];

  if (!preset) {
    return reportUnknownPreset(options, errors);
  }

  return applyKnownPreset(options, preset, errors);
};

const parseLessonName = (lessonName, errors) => {
  const match = /^(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(lessonName ?? "");

  if (!match) {
    errors.push("--lesson must use <number>-<slug>, for example 091-borrowed-config-view.");
    return null;
  }

  return {
    numberText: match[1],
    number: Number.parseInt(match[1], 10),
    slug: match[2],
  };
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

const parseNumericOptions = (initialOptions, errors) => ({
  ...initialOptions,
  estimatedMinutes: parsePositiveInteger(
    initialOptions.estimatedMinutes,
    "--estimated-minutes",
    errors,
    8,
  ),
  arcLength: parsePositiveInteger(initialOptions.arcLength, "--arc-length", errors, null),
});

const readCurriculumState = async () => {
  const [arcs, concepts, lessonRecords] = await Promise.all([
    readJson(SOURCE_ARCS_PATH),
    readJson(SOURCE_CONCEPTS_PATH),
    readExistingLessons(),
  ]);

  return { arcs, concepts, lessonRecords };
};

const lessonIdFromName = (lessonName) =>
  lessonName ? `${lessonName.slug}-${lessonName.numberText}` : "";

const expectedLessonOrder = (options, targetRecord, lessonRecords) =>
  options.force && targetRecord ? targetRecord.lesson.order : maxLessonOrder(lessonRecords) + 1;

const defaultedTests = (tests) =>
  tests.length > 0 ? unique(tests) : [DEFAULT_TEST_PATH];

const lessonDirForOptions = (options) =>
  join(LESSONS_ROOT, options.arc || "", options.lesson || "");

const lessonOrderFromName = (lessonName) =>
  lessonName ? lessonName.number : 0;

const previousLessonInArc = (arcLessons) => arcLessons.at(-1) || null;

const derivedLessonState = (options, lessonName, state) => {
  const lessonId = lessonIdFromName(lessonName);
  const lessonDir = lessonDirForOptions(options);
  const targetRecord = targetExistingRecord(state.lessonRecords, lessonDir, lessonId);
  const arcLessons = lessonsInArc(state.lessonRecords, options.arc, targetRecord);
  const previousLessonRecord = previousLessonInArc(arcLessons);
  const targetLessonCount = arcLessons.length + 1;
  const autoReadonly = previousProjectPaths(previousLessonRecord)
    .filter((path) => path !== options.editable);

  return {
    arcLessons,
    autoReadonly,
    lessonDir,
    lessonId,
    previousLessonRecord,
    targetLessonCount,
    targetRecord,
  };
};

const buildNormalizedOptions = (options, lessonName, state) => {
  const derived = derivedLessonState(options, lessonName, state);

  return {
    ...options,
    ...state,
    lessonName,
    lessonId: derived.lessonId,
    lessonDir: derived.lessonDir,
    targetRecord: derived.targetRecord,
    expectedOrder: expectedLessonOrder(options, derived.targetRecord, state.lessonRecords),
    arcLessons: derived.arcLessons,
    previousLessonRecord: derived.previousLessonRecord,
    existingArc: byId(state.arcs).get(options.arc),
    existingConcept: byId(state.concepts).get(options.concept),
    order: lessonOrderFromName(lessonName),
    day: derived.targetLessonCount,
    arcLength: derived.targetLessonCount,
    requestedArcLength: options.arcLength,
    targetLessonCount: derived.targetLessonCount,
    readonly: unique([...derived.autoReadonly, ...options.readonly]),
    tests: defaultedTests(options.tests),
    compileFail: unique(options.compileFail),
  };
};

const normalizeInputs = async (initialOptions, initialErrors) => {
  const errors = [...initialErrors];

  validateRequiredOptions(initialOptions, errors);

  const options = applyPreset(parseNumericOptions(initialOptions, errors), errors);
  const lessonName = parseLessonName(options.lesson, errors);
  const normalized = buildNormalizedOptions(options, lessonName, await readCurriculumState());

  await validateNormalizedOptions(normalized, errors);

  return { options: normalized, errors };
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

const validateNormalizedOptions = async (options, errors) => {
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

const placeholder = (text) => `${PLACEHOLDER_MARKER} ${text}`;

const starterTemplate = () => `pub fn todo_lesson() {
    todo!("${placeholder("replace starter code")}");
}
`;

const solutionTemplate = () => `pub fn todo_lesson() {
    todo!("${placeholder("replace solution code")}");
}
`;

const sourceWithTodo = (source, text) => `${source.trimEnd()}

// ${placeholder(text)}
`;

const editableStarterContent = async (options) => {
  const sourcePath = await previousSnapshotSourcePath(options.previousLessonRecord, options.editable);

  return sourcePath
    ? sourceWithTodo(await readFile(sourcePath, "utf8"), "replace or extend starter code.")
    : starterTemplate();
};

const editableSolutionContent = async (options) => {
  const sourcePath = await previousSnapshotSourcePath(options.previousLessonRecord, options.editable);

  return sourcePath
    ? sourceWithTodo(await readFile(sourcePath, "utf8"), "replace or extend solution code.")
    : solutionTemplate();
};

const defaultTestTemplate = () => `#[test]
fn public_behavior_is_authored() {
    panic!("${placeholder("replace this test")}");
}
`;

const tokioTestTemplate = () => `#[tokio::test]
async fn public_behavior_is_authored() {
    panic!("${placeholder("replace this async test")}");
}
`;

const actixTestTemplate = () => `#[actix_rt::test]
async fn public_behavior_is_authored() {
    panic!("${placeholder("replace this Actix test")}");
}
`;

const proptestTemplate = () => `use proptest::prelude::*;

proptest! {
    #[test]
    fn public_behavior_is_authored(_value in 0u8..1) {
        prop_assert!(false, "${placeholder("replace this property")}");
    }
}
`;

const testTemplate = (kind) => {
  const templates = {
    default: defaultTestTemplate,
    tokio: tokioTestTemplate,
    actix: actixTestTemplate,
    proptest: proptestTemplate,
  };

  return (templates[kind] ?? defaultTestTemplate)();
};

const compileFailTemplate = () => `compile_error!("${placeholder("replace compile-fail case")}");
`;

const notesTemplate = () => `# Author Notes

${placeholder("record lesson intent, idiomatic solution notes, and validation risks before publishing.")}
`;

const lessonFiles = (options) => [
  {
    path: options.editable,
    role: "editable",
    sourcePath: `starter/${options.editable}`,
  },
  ...options.readonly.map((path) => ({
    path,
    role: "readonly",
    sourcePath: `starter/${path}`,
  })),
  ...options.tests.map((path) => ({
    path,
    role: "test",
    sourcePath: path,
  })),
];

const compileFailValidation = (options) => ({
  mode: "backend-compile-fail",
  timeoutMs: 10000,
  dependencySet: options.dependencySet,
  cases: options.compileFail.map((name) => ({
    name,
    expectedDiagnostics: [placeholder("replace expected diagnostic")],
    sourcePath: compileFailCasePath(name),
  })),
});

const lessonValidation = (options) => {
  const validations = [];

  if (options.structural) {
    validations.push({
      mode: "structural",
      timeoutMs: 10000,
      checks: [
        {
          type: "source_includes",
          requiredSnippets: [PLACEHOLDER_MARKER],
        },
      ],
    });
  }

  validations.push({
    mode: "backend-cargo-test",
    timeoutMs: 10000,
    dependencySet: options.dependencySet,
    testFiles: options.tests.map((path) => ({
      path,
      sourcePath: path,
    })),
  });

  if (options.compileFail.length > 0) {
    validations.push(compileFailValidation(options));
  }

  return {
    mode: "all",
    validations,
  };
};

const buildLessonJson = (options) => ({
  schemaVersion: 2,
  id: options.lessonId,
  arcId: options.arc,
  arcTitle: options.existingArc?.title ?? options.arcTitle,
  order: options.order,
  day: options.day,
  arcLength: options.arcLength,
  title: options.title,
  conceptId: options.concept,
  difficulty: options.difficulty,
  estimatedMinutes: options.estimatedMinutes,
  scenario: placeholder("describe the situation."),
  instructions: placeholder(`describe the edit in ${options.editable}.`),
  files: lessonFiles(options),
  hints: [
    {
      level: 1,
      body: placeholder("first small hint."),
    },
    {
      level: 2,
      body: placeholder("more direct hint."),
    },
    {
      level: 3,
      body: placeholder("final hint before solution."),
    },
  ],
  completionExplanation: placeholder("explain why the completed solution is idiomatic."),
  validation: lessonValidation(options),
  author: {
    solutionPath: "solution",
    notesPath: "notes.md",
  },
});

const updatedArcs = (options) => {
  if (options.existingArc) {
    return sortRecordsByOrderThenId(
      options.arcs.map((arc) =>
        arc.id === options.arc
          ? { ...arc, targetLessonCount: options.targetLessonCount }
          : arc,
      ),
    );
  }

  return sortRecordsByOrderThenId([
    ...options.arcs,
    {
      id: options.arc,
      title: options.arcTitle,
      pillar: options.arcPillar,
      orderStart: options.order,
      targetLessonCount: options.targetLessonCount,
      description: options.arcDescription,
    },
  ]);
};

const updatedConcepts = (options) => {
  if (options.existingConcept) {
    return sortRecordsById(
      options.concepts.map((concept) =>
        concept.id === options.concept
          ? { ...concept, lessonIds: unique([...concept.lessonIds, options.lessonId]) }
          : concept,
      ),
    );
  }

  return sortRecordsById([
    ...options.concepts,
    {
      id: options.concept,
      name: options.title,
      description: placeholder("describe this concept."),
      prerequisites: [],
      difficulty: [options.difficulty],
      lessonIds: [options.lessonId],
      tags: ["TODO-author"],
      masteryThreshold: 3,
    },
  ]);
};

const arcLessonLengthWrites = (options) =>
  options.arcLessons
    .filter((record) => record.lesson.arcLength !== options.targetLessonCount)
    .map((record) =>
      jsonWrite(record.jsonPath, {
        ...record.lesson,
        arcLength: options.targetLessonCount,
      }),
    );

const textWrite = (path, content, protectedWrite = true) => ({
  kind: "text",
  path,
  content,
  protectedWrite,
});

const jsonWrite = (path, value) => ({
  kind: "json",
  path,
  value,
  protectedWrite: false,
});

const copyWrite = (source, path) => ({
  kind: "copy",
  source,
  path,
  protectedWrite: true,
});

const readonlyCopyWrites = async (options) =>
  Promise.all(
    options.readonly.flatMap(async (path) => {
      const source = await previousSnapshotSourcePath(options.previousLessonRecord, path);

      return [
        copyWrite(source, join(options.lessonDir, "starter", path)),
        copyWrite(source, join(options.lessonDir, "solution", path)),
      ];
    }),
  );

const buildWritePlan = async (options) => {
  const lessonJson = buildLessonJson(options);
  const readonlyWrites = (await readonlyCopyWrites(options)).flat();
  const writes = [
    textWrite(join(options.lessonDir, "lesson.json"), `${JSON.stringify(lessonJson, null, 2)}\n`),
    textWrite(join(options.lessonDir, "starter", options.editable), await editableStarterContent(options)),
    textWrite(join(options.lessonDir, "solution", options.editable), await editableSolutionContent(options)),
    ...options.tests.map((path) =>
      textWrite(join(options.lessonDir, path), testTemplate(options.testTemplate)),
    ),
    ...options.compileFail.map((name) =>
      textWrite(join(options.lessonDir, compileFailCasePath(name)), compileFailTemplate()),
    ),
    textWrite(join(options.lessonDir, "notes.md"), notesTemplate()),
    ...readonlyWrites,
    ...arcLessonLengthWrites(options),
    jsonWrite(SOURCE_ARCS_PATH, updatedArcs(options)),
    jsonWrite(SOURCE_CONCEPTS_PATH, updatedConcepts(options)),
  ];

  return {
    lessonJson,
    writes,
  };
};

const validateUniqueWriteTarget = (paths, write, errors) => {
  if (paths.has(write.path)) {
    errors.push(`Write plan contains duplicate target ${repoRelativePath(write.path)}.`);
  }

  paths.add(write.path);
};

const shouldCheckProtectedOverwrite = async (write, force) =>
  force && write.protectedWrite && (await pathExists(write.path));

const validateProtectedOverwrite = async (write, force, errors) => {
  if (!(await shouldCheckProtectedOverwrite(write, force))) {
    return;
  }

  const current = await readFile(write.path, "utf8");

  if (!current.includes(PLACEHOLDER_MARKER)) {
    errors.push(`${repoRelativePath(write.path)} does not contain ${PLACEHOLDER_MARKER}; refusing to overwrite.`);
  }
};

const validateWritePlan = async (writes, force) => {
  const errors = [];
  const paths = new Set();

  for (const write of writes) {
    validateUniqueWriteTarget(paths, write, errors);
    await validateProtectedOverwrite(write, force, errors);
  }

  return errors;
};

const executeWrite = async (write) => {
  await mkdir(dirname(write.path), { recursive: true });

  if (write.kind === "json") {
    await writeJsonFile(write.path, write.value);
  } else if (write.kind === "copy") {
    await copyFile(write.source, write.path);
  } else {
    await writeFile(write.path, write.content);
  }
};

const executeWritePlan = async (writes) => {
  const regularWrites = writes.filter((write) => write.kind !== "json");
  const jsonWrites = writes.filter((write) => write.kind === "json");

  for (const write of [...regularWrites, ...jsonWrites]) {
    await executeWrite(write);
  }
};

const printSuccess = (options, writes) => {
  const sourceWrites = writes
    .filter((write) => write.kind !== "json")
    .map((write) => `- ${repoRelativePath(write.path)}`);

  console.log("Created lesson scaffold:");
  console.log(sourceWrites.join("\n"));
  console.log("\nNext:");
  console.log("1. Replace every TODO(author) placeholder.");
  console.log("2. cd frontend && npm run content:validate-source");
  console.log("3. cd frontend && npm run content:generate");
  console.log("4. cd frontend && npm run content:check-refs && npm run content:check");
  console.log(`5. scripts/test-lesson-solutions.sh lessons/${options.arc}/${options.lesson}`);
};

const reportAndExit = (errors) => {
  console.error(`Scaffold failed with ${errors.length} issue(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
};

const main = async () => {
  const parsed = parseArgs(process.argv.slice(2));
  const { options, errors } = await normalizeInputs(parsed.options, parsed.errors);

  if (errors.length > 0) {
    reportAndExit(errors);
  }

  const { writes } = await buildWritePlan(options);
  const writeErrors = await validateWritePlan(writes, options.force);

  if (writeErrors.length > 0) {
    reportAndExit(writeErrors);
  }

  await executeWritePlan(writes);
  printSuccess(options, writes);
};

await main();
