import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  placeholder,
  PLACEHOLDER_MARKER,
  notesTemplate,
} from "../scaffold-presets.mjs";
import {
  REQUIRED_LIB_PATH,
  SOURCE_ARCS_PATH,
  SOURCE_CONCEPTS_PATH,
  sortRecordsById,
  sortRecordsByOrderThenId,
} from "../shared.mjs";
import {
  compileFailCasePath,
  unique,
} from "./names.mjs";
import {
  previousSnapshotSourcePath,
} from "./state.mjs";
import {
  copyWrite,
  jsonWrite,
  textWrite,
} from "./write-plan.mjs";

const sourceWithTodo = (source, text) => `${source.trimEnd()}

// ${placeholder(text)}
`;

const editableStarterContent = async (options) => {
  const sourcePath = await previousSnapshotSourcePath(options.previousLessonRecord, options.editable);

  return sourcePath
    ? sourceWithTodo(await readFile(sourcePath, "utf8"), "replace or extend starter code.")
    : options.scaffoldPreset.starterTemplate();
};

const editableSolutionContent = async (options) => {
  const sourcePath = await previousSnapshotSourcePath(options.previousLessonRecord, options.editable);

  return sourcePath
    ? sourceWithTodo(await readFile(sourcePath, "utf8"), "replace or extend solution code.")
    : options.scaffoldPreset.solutionTemplate();
};

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

const buildLessonJson = (options, solutionCode) => ({
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
      solutionCode,
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

export const buildWritePlan = async (options) => {
  const starterContent = await editableStarterContent(options);
  const solutionContent = await editableSolutionContent(options);
  const lessonJson = buildLessonJson(options, solutionContent);
  const readonlyWrites = (await readonlyCopyWrites(options)).flat();
  const writes = [
    textWrite(join(options.lessonDir, "lesson.json"), `${JSON.stringify(lessonJson, null, 2)}\n`),
    textWrite(join(options.lessonDir, "starter", options.editable), starterContent),
    textWrite(join(options.lessonDir, "solution", options.editable), solutionContent),
    ...options.tests.map((path) =>
      textWrite(join(options.lessonDir, path), options.scaffoldPreset.testTemplate()),
    ),
    ...options.compileFail.map((name) =>
      textWrite(
        join(options.lessonDir, compileFailCasePath(name)),
        options.scaffoldPreset.compileFailTemplate(name),
      ),
    ),
    textWrite(join(options.lessonDir, "notes.md"), notesTemplate(options.scaffoldPreset)),
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
