import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import assert from "node:assert/strict";
import {
  assertIncludes,
  withTempRoot,
} from "./test-support.mjs";
import { parseArgs } from "./scaffold/args.mjs";
import { buildWritePlan } from "./scaffold/build.mjs";
import {
  textWrite,
  validateWritePlan,
} from "./scaffold/write-plan.mjs";
import {
  validateInstructionsNameEditablePath,
} from "./source-validation/authoring.mjs";
import {
  validateLessonDomain,
} from "./source-validation/schema.mjs";

const minimalPreset = {
  starterTemplate: () => "pub fn starter() {}\n",
  solutionTemplate: () => "pub fn solution() {}\n",
  testTemplate: () => "#[test]\nfn public() {}\n",
  compileFailTemplate: (name) => `compile_error!("${name}");\n`,
  notes: {
    conceptBoundary: "concept",
    intendedSolution: "solution",
    validationStrategy: "validation",
    commonWrongSolutions: "wrong",
    arcContinuity: "continuity",
    reviewChecklist: "review",
  },
};

const baseLesson = () => ({
  schemaVersion: 2,
  id: "fixture-001",
  arcId: "fixture",
  arcTitle: "Fixture",
  order: 1,
  day: 1,
  arcLength: 1,
  title: "Fixture",
  conceptId: "fixture-concept",
  difficulty: "easy",
  estimatedMinutes: 5,
  scenario: "Fixture service scenario.",
  instructions: "Edit src/lib.rs.",
  files: [],
  hints: [],
  completionExplanation: "Done.",
  validation: {
    mode: "self-check",
  },
});

const testParseArgs = () => {
  const parsed = parseArgs([
    "--arc",
    "fixture",
    "--readonly",
    "src/model.rs",
    "--readonly",
    "fixtures/sample.json",
    "--dry-run",
  ]);

  assert.deepEqual(parsed.errors, []);
  assert.equal(parsed.options.arc, "fixture");
  assert.equal(parsed.options.dryRun, true);
  assert.deepEqual(parsed.options.readonly, ["src/model.rs", "fixtures/sample.json"]);

  const duplicate = parseArgs(["--arc", "one", "--arc", "two"]);
  assertIncludes(duplicate.errors, "--arc can be provided only once", "duplicate arg");

  const unknown = parseArgs(["--missing"]);
  assertIncludes(unknown.errors, "Unknown flag --missing", "unknown arg");
};

const testSchemaValidation = () => {
  const errors = [];

  validateLessonDomain(errors, "lesson.json", {
    ...baseLesson(),
    unknown: true,
    difficulty: "expert",
  });

  assertIncludes(errors, "unknown field unknown", "unknown lesson field");
  assertIncludes(errors, "difficulty is invalid", "difficulty");
};

const testInstructionPathValidation = () => {
  const errors = [];

  validateInstructionsNameEditablePath(errors, {
    id: "fixture-001",
    instructions: "Make the helper pass.",
    files: [
      {
        path: "src/config.rs",
        role: "editable",
      },
    ],
  });

  assertIncludes(errors, "instructions must name editable file src/config.rs", "editable path");
};

const buildOptions = (root) => ({
  arc: "fixture",
  arcLessons: [],
  arcLength: 1,
  arcPillar: "ownership",
  arcTitle: "Fixture Arc",
  arcDescription: "Fixture arc.",
  arcs: [],
  compileFail: ["public-contract"],
  concept: "fixture-concept",
  concepts: [],
  day: 1,
  dependencySet: "std",
  difficulty: "easy",
  editable: "src/lib.rs",
  estimatedMinutes: 8,
  existingArc: null,
  existingConcept: null,
  lesson: "001-fixture",
  lessonDir: join(root, "fixture", "001-fixture"),
  lessonId: "fixture-001",
  order: 1,
  previousLessonRecord: null,
  readonly: [],
  scaffoldPreset: minimalPreset,
  structural: true,
  targetLessonCount: 1,
  tests: ["tests/public.rs"],
  title: "Fixture",
});

const testBuildWritePlan = () =>
  withTempRoot("rust-daily-curriculum-modules-", async (root) => {
    const { lessonJson, writes } = await buildWritePlan(buildOptions(root));
    const writePaths = writes.map((write) => write.path);

    assert.equal(lessonJson.id, "fixture-001");
    assert.equal(lessonJson.validation.validations.length, 3);
    assert.equal(lessonJson.hints.at(-1).solutionCode, "pub fn solution() {}\n");
    assert(writePaths.some((path) => path.endsWith("lesson.json")));
    assert(writePaths.some((path) => path.endsWith("compile_fail/public_contract.rs")));
  });

const testProtectedWriteValidation = () =>
  withTempRoot("rust-daily-curriculum-modules-", async (root) => {
    const lockedPath = join(root, "starter.rs");

    await writeFile(lockedPath, "pub fn locked() {}\n");
    const errors = await validateWritePlan(
      [
        textWrite(lockedPath, "replacement", true),
        textWrite(lockedPath, "duplicate", true),
      ],
      true,
    );

    assertIncludes(errors, "duplicate target", "duplicate write");
    assertIncludes(errors, "refusing to overwrite", "protected overwrite");
  });

const cases = [
  ["parse args", testParseArgs],
  ["schema validation", testSchemaValidation],
  ["instruction path validation", testInstructionPathValidation],
  ["build write plan", testBuildWritePlan],
  ["protected write validation", testProtectedWriteValidation],
];

for (const [name, run] of cases) {
  await run();
  console.log(`ok - ${name}`);
}
