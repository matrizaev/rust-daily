import { dirname, join } from "node:path";
import {
  findLessonJsonFiles,
  FRONTEND_CONCEPTS_PATH,
  FRONTEND_LESSONS_PATH,
  readJson,
  readSourceText,
  reportErrorsOrLog,
  SOURCE_CONCEPTS_PATH,
} from "./shared.mjs";

const SOURCE_ARCS_PATH = join(dirname(SOURCE_CONCEPTS_PATH), "arcs.json");

const normalizationKinds = [
  ["string", (value) => typeof value === "string"],
  ["array", Array.isArray],
  [
    "object",
    (value) => value !== null && typeof value === "object",
  ],
];

const normalizationKind = (value) =>
  normalizationKinds.find(([_kind, matches]) => matches(value))?.[0] ??
  "identity";

const normalizeObjectNewlines = (value) =>
  Object.fromEntries(
    Object.entries(value).map(([key, item]) => [
      key,
      normalizeNewlines(item),
    ]),
  );

const newlineNormalizers = {
  string: (value) => value.replaceAll("\r\n", "\n"),
  array: (value) => value.map(normalizeNewlines),
  object: normalizeObjectNewlines,
  identity: (value) => value,
};

const normalizeNewlines = (value) =>
  newlineNormalizers[normalizationKind(value)](value);

const jsonEqual = (left, right) =>
  JSON.stringify(normalizeNewlines(left)) ===
  JSON.stringify(normalizeNewlines(right));

const inlineFile = async (lessonJsonPath, file) => {
  const { sourcePath, ...runtimeFile } = file;

  return {
    ...runtimeFile,
    content:
      typeof file.content === "string"
        ? file.content
        : await readSourceText(lessonJsonPath, sourcePath),
  };
};

const testFilesDuplicateLessonFiles = (lessonFiles, testFiles) => {
  const lessonContents = new Map(
    lessonFiles.map((file) => [file.path, file.content]),
  );

  return testFiles.every(
    (file) => lessonContents.get(file.path) === file.content,
  );
};

const isAllValidation = (validation) => validation?.mode === "all";

const hasBackendTestFiles = (validation) =>
  validation?.mode === "backend-cargo-test" &&
  Array.isArray(validation.testFiles);

const inlineAllValidation = async (
  lessonJsonPath,
  validation,
  lessonFiles,
) => ({
  ...validation,
  validations: await Promise.all(
    validation.validations.map((step) =>
      inlineValidation(lessonJsonPath, step, lessonFiles),
    ),
  ),
});

const inlineBackendValidation = async (
  lessonJsonPath,
  validation,
  lessonFiles,
) => {
  const testFiles = await Promise.all(
    validation.testFiles.map((file) => inlineFile(lessonJsonPath, file)),
  );
  const { testFiles: _sourceTestFiles, ...runtimeValidation } = validation;

  return testFilesDuplicateLessonFiles(lessonFiles, testFiles)
    ? runtimeValidation
    : { ...runtimeValidation, testFiles };
};

const inlineValidation = (
  lessonJsonPath,
  validation,
  lessonFiles,
) => {
  if (isAllValidation(validation)) {
    return inlineAllValidation(
      lessonJsonPath,
      validation,
      lessonFiles,
    );
  }

  if (hasBackendTestFiles(validation)) {
    return inlineBackendValidation(
      lessonJsonPath,
      validation,
      lessonFiles,
    );
  }

  return Promise.resolve(validation);
};

const runtimeLessonFromSource = async (lessonJsonPath) => {
  const lesson = await readJson(lessonJsonPath);
  const files = await Promise.all(
    lesson.files.map((file) => inlineFile(lessonJsonPath, file)),
  );
  const validation = await inlineValidation(
    lessonJsonPath,
    lesson.validation,
    files,
  );
  const {
    author: _author,
    starterCode: _starterCode,
    ...runtimeLesson
  } = lesson;

  return {
    ...runtimeLesson,
    files,
    validation,
  };
};

const duplicateValues = (values) => {
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

const validateArcReferences = (errors, arcs, lessons) => {
  const arcIds = new Set(arcs.map((arc) => arc.id));

  lessons.forEach((lesson) => {
    if (!arcIds.has(lesson.arcId)) {
      errors.push(`${lesson.id} references missing arc ${lesson.arcId}.`);
    }
  });

  arcs.forEach((arc) => {
    const arcLessons = lessons.filter((lesson) => lesson.arcId === arc.id);

    if (arcLessons.length === 0) {
      errors.push(`${arc.id} has no source lessons.`);
      return;
    }

    const firstOrder = Math.min(
      ...arcLessons.map((lesson) => lesson.order),
    );

    if (arc.orderStart !== firstOrder) {
      errors.push(
        `${arc.id} orderStart is ${arc.orderStart}; expected ${firstOrder}.`,
      );
    }

    if (arc.targetLessonCount !== arcLessons.length) {
      errors.push(
        `${arc.id} targetLessonCount is ${arc.targetLessonCount}; expected ${arcLessons.length}.`,
      );
    }

    arcLessons.forEach((lesson) => {
      if (lesson.arcTitle !== arc.title) {
        errors.push(
          `${lesson.id} arcTitle does not match the ${arc.id} title.`,
        );
      }
    });
  });
};

const validateConceptReferences = (errors, concepts, lessons) => {
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));

  concepts.forEach((concept) => {
    concept.prerequisites.forEach((prerequisite) => {
      if (!conceptIds.has(prerequisite)) {
        errors.push(
          `${concept.id} references missing prerequisite ${prerequisite}.`,
        );
      }
    });

    concept.lessonIds.forEach((lessonId) => {
      if (!lessonIds.has(lessonId)) {
        errors.push(`${concept.id} references missing lesson ${lessonId}.`);
      }
    });
  });
};

const validateUniqueOrders = (errors, lessons) => {
  duplicateValues(lessons.map((lesson) => lesson.order)).forEach((order) => {
    errors.push(`Source lessons have duplicate order ${order}.`);
  });
};

const recordsById = (records) =>
  new Map(records.map((record) => [record.id, record]));

const validateRecordParity = (
  errors,
  label,
  sourceRecords,
  generatedRecords,
) => {
  const sourceById = recordsById(sourceRecords);
  const generatedById = recordsById(generatedRecords);

  sourceById.forEach((source, id) => {
    const generated = generatedById.get(id);

    if (!generated) {
      errors.push(`Generated ${label} is missing ${id}.`);
    } else if (!jsonEqual(generated, source)) {
      errors.push(`Generated ${label} ${id} is out of sync with its source.`);
    }
  });

  generatedById.forEach((_generated, id) => {
    if (!sourceById.has(id)) {
      errors.push(`Generated ${label} ${id} has no canonical source.`);
    }
  });
};

const main = async () => {
  const lessonJsonPaths = await findLessonJsonFiles();
  const [arcs, concepts, generatedConcepts, generatedLessons, sourceLessons] =
    await Promise.all([
      readJson(SOURCE_ARCS_PATH),
      readJson(SOURCE_CONCEPTS_PATH),
      readJson(FRONTEND_CONCEPTS_PATH),
      readJson(FRONTEND_LESSONS_PATH),
      Promise.all(lessonJsonPaths.map(runtimeLessonFromSource)),
    ]);
  const errors = [];

  duplicateValues(arcs.map((arc) => arc.id)).forEach((id) => {
    errors.push(`Source arcs have duplicate id ${id}.`);
  });
  validateArcReferences(errors, arcs, sourceLessons);
  validateConceptReferences(errors, concepts, sourceLessons);
  validateUniqueOrders(errors, sourceLessons);
  validateRecordParity(
    errors,
    "lesson",
    sourceLessons,
    generatedLessons,
  );
  validateRecordParity(
    errors,
    "concept",
    concepts,
    generatedConcepts,
  );

  reportErrorsOrLog(
    errors,
    "Content reference check failed",
    `Content reference check passed: ${sourceLessons.length} lessons, ${concepts.length} concepts, ${arcs.length} arcs.`,
  );
};

await main();
