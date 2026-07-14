import { push } from "../lib/diagnostics.mjs";
import { normalizeSource } from "../lib/primitives.mjs";
import {
  editablePath,
  lessonFileByPath,
  readAuthorNotes,
  readLessonFileSource,
  readSolution,
  solutionSnapshotSource,
} from "./source-access.mjs";
import {
  validateCurrentStructuralChecksTargetEditableFile,
  validateSolutionSatisfiesStructuralChecks,
} from "./structural-checks.mjs";

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

const DOMAIN_TYPE_PATTERN = /\b(?:pub\s+)?(?:struct|enum)\s+([A-Z][A-Za-z0-9_]*)\b/g;
const RAW_KEY_VALUE_COLLECTION_PATTERN =
  /\b(?:HashMap|BTreeMap)\s*<\s*String\s*,\s*String\b|\bVec\s*<\s*\(\s*(?:&str|String)\s*,\s*(?:&str|String)\s*\)|&?\s*\[\s*\(\s*(?:&str|String)\s*,\s*(?:&str|String)\s*\)\s*\]/;
const RAW_BOUNDARY_NOTE = "Intentional raw boundary:";

const domainTypesFromSource = (source) => {
  const names = new Set();
  let match = DOMAIN_TYPE_PATTERN.exec(source);

  while (match) {
    names.add(match[1]);
    match = DOMAIN_TYPE_PATTERN.exec(source);
  }

  return [...names];
};

const createRawBoundaryState = () => ({
  previousDomainNames: new Set(),
  previousLessonId: null,
});

const rawBoundaryContext = async (state, lessonRecord) => ({
  domainNames: [...state.previousDomainNames],
  editableSolution: await readSolution(lessonRecord.lessonJsonPath, lessonRecord.lesson),
  notes: await readAuthorNotes(lessonRecord.lessonJsonPath, lessonRecord.lesson),
});

const omitsExistingDomainNames = (domainNames, source) =>
  !domainNames.some((name) => source.includes(name));

const shouldReportRawBoundaryDetour = ({ domainNames, editableSolution, notes }) =>
  [
    domainNames.length > 0,
    RAW_KEY_VALUE_COLLECTION_PATTERN.test(editableSolution),
    omitsExistingDomainNames(domainNames, editableSolution),
    !notes.includes(RAW_BOUNDARY_NOTE),
  ].every(Boolean);

const reportRawBoundaryDetour = (errors, state, lessonRecord, context) => {
  if (!shouldReportRawBoundaryDetour(context)) {
    return;
  }

  push(
    errors,
    `${lessonRecord.lesson.id} uses raw key/value collection after ${state.previousLessonId} introduced domain type ${context.domainNames[0]}; use domain types or add ${RAW_BOUNDARY_NOTE} to notes.`,
  );
};

const rememberDomainTypes = async (state, lessonRecord) => {
  const snapshot = await solutionSnapshotSource(lessonRecord.lessonJsonPath, lessonRecord.lesson);

  domainTypesFromSource(snapshot).forEach((name) => state.previousDomainNames.add(name));
  state.previousLessonId =
    state.previousDomainNames.size > 0 ? lessonRecord.lesson.id : state.previousLessonId;
};

const validateRawBoundaryLesson = async (errors, state, lessonRecord) => {
  const context = await rawBoundaryContext(state, lessonRecord);

  reportRawBoundaryDetour(errors, state, lessonRecord, context);
  await rememberDomainTypes(state, lessonRecord);
};

const validateRawBoundaryDetours = async (errors, ordered) => {
  const state = createRawBoundaryState();

  for (const lessonRecord of ordered) {
    await validateRawBoundaryLesson(errors, state, lessonRecord);
  }
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

  await validateRawBoundaryDetours(errors, ordered);
};

export const validateCumulativeLessons = async (errors, lessonRecords) => {
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
