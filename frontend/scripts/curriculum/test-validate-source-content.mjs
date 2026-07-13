import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = join(SCRIPT_DIR, "..", "..");
const VALIDATOR_PATH = join(SCRIPT_DIR, "validate-source-content.mjs");

const formatJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

const lessonOneSolution = `pub fn greet() -> &'static str {
    "hi"
}
`;

const lessonTwoSolution = `pub fn next() -> &'static str {
    "next"
}
`;

const configDomainSolution = `pub struct Config {
    pub port: u16,
}

pub fn greet() -> &'static str {
    "hi"
}
`;

const rawTupleDetourSolution = `pub fn next(pairs: &[(&str, &str)]) -> Option<&str> {
    pairs
        .iter()
        .find_map(|(key, value)| (*key == "port").then_some(*value))
}
`;

const publicTest = `#[test]
fn public_contract_exists() {
    assert!(true);
}
`;

const notes = "Fixture lesson for source validation tests.\n";

const baseLesson = ({
  id,
  conceptId,
  order,
  day,
  title,
  instructions,
  files,
  solutionCode,
  checks,
}) => ({
  schemaVersion: 2,
  id,
  arcId: "fixture-arc",
  arcTitle: "Fixture Arc",
  order,
  day,
  arcLength: 2,
  title,
  conceptId,
  difficulty: "medium",
  estimatedMinutes: 5,
  scenario: "Fixture service scenario.",
  instructions,
  files,
  hints: [
    {
      level: 1,
      body: "First hint.",
    },
    {
      level: 2,
      body: "Second hint.",
    },
    {
      level: 3,
      body: "Final hint.",
      solutionCode,
    },
  ],
  completionExplanation: "Fixture complete.",
  validation: {
    mode: "all",
    validations: [
      {
        mode: "structural",
        timeoutMs: 10000,
        checks,
      },
      {
        mode: "backend-cargo-test",
        timeoutMs: 10000,
        dependencySet: "std",
        testFiles: [
          {
            path: "tests/public.rs",
            sourcePath: "tests/public.rs",
          },
        ],
      },
    ],
  },
  author: {
    solutionPath: "solution",
    notesPath: "notes.md",
  },
});

const createFixtureState = () => ({
  concepts: [
    {
      id: "fixture-concept-1",
      name: "Fixture one",
      description: "Fixture concept one.",
      prerequisites: [],
      difficulty: ["medium"],
      lessonIds: ["fixture-001"],
      tags: [],
      masteryThreshold: 1,
    },
    {
      id: "fixture-concept-2",
      name: "Fixture two",
      description: "Fixture concept two.",
      prerequisites: ["fixture-concept-1"],
      difficulty: ["medium"],
      lessonIds: ["fixture-002"],
      tags: [],
      masteryThreshold: 1,
    },
  ],
  lessons: [
    {
      dir: "fixture-arc/001-greet",
      lesson: baseLesson({
        id: "fixture-001",
        conceptId: "fixture-concept-1",
        order: 1,
        day: 1,
        title: "Greet",
        instructions: "In src/lib.rs keep greet available.",
        files: [
          {
            path: "src/lib.rs",
            role: "editable",
            sourcePath: "starter/src/lib.rs",
          },
          {
            path: "tests/public.rs",
            role: "test",
            sourcePath: "tests/public.rs",
          },
        ],
        solutionCode: lessonOneSolution,
        checks: [
          {
            type: "source_includes",
            requiredSnippets: ["pub fn greet"],
          },
        ],
      }),
    },
    {
      dir: "fixture-arc/002-next",
      lesson: baseLesson({
        id: "fixture-002",
        conceptId: "fixture-concept-2",
        order: 2,
        day: 2,
        title: "Next",
        instructions: "In src/next.rs add next.",
        files: [
          {
            path: "src/lib.rs",
            role: "readonly",
            sourcePath: "starter/src/lib.rs",
          },
          {
            path: "src/next.rs",
            role: "editable",
            sourcePath: "starter/src/next.rs",
          },
          {
            path: "tests/public.rs",
            role: "test",
            sourcePath: "tests/public.rs",
          },
        ],
        solutionCode: lessonTwoSolution,
        checks: [
          {
            type: "source_includes",
            requiredSnippets: ["pub fn next"],
          },
        ],
      }),
    },
  ],
  files: new Map([
    ["fixture-arc/001-greet/starter/src/lib.rs", lessonOneSolution],
    ["fixture-arc/001-greet/solution/src/lib.rs", lessonOneSolution],
    ["fixture-arc/001-greet/tests/public.rs", publicTest],
    ["fixture-arc/001-greet/notes.md", notes],
    ["fixture-arc/002-next/starter/src/lib.rs", lessonOneSolution],
    ["fixture-arc/002-next/starter/src/next.rs", lessonTwoSolution],
    ["fixture-arc/002-next/solution/src/next.rs", lessonTwoSolution],
    ["fixture-arc/002-next/tests/public.rs", publicTest],
    ["fixture-arc/002-next/notes.md", notes],
  ]),
});

const cloneState = (state) => ({
  concepts: JSON.parse(JSON.stringify(state.concepts)),
  lessons: JSON.parse(JSON.stringify(state.lessons)),
  files: new Map(state.files),
});

const applyRawTupleDetourFixture = (state) => {
  state.files.set("fixture-arc/001-greet/starter/src/lib.rs", configDomainSolution);
  state.files.set("fixture-arc/001-greet/solution/src/lib.rs", configDomainSolution);
  state.files.set("fixture-arc/002-next/starter/src/lib.rs", configDomainSolution);
  state.files.set("fixture-arc/002-next/starter/src/next.rs", rawTupleDetourSolution);
  state.files.set("fixture-arc/002-next/solution/src/next.rs", rawTupleDetourSolution);
  state.lessons[0].lesson.hints[2].solutionCode = configDomainSolution;
  state.lessons[1].lesson.hints[2].solutionCode = rawTupleDetourSolution;
};

const writeText = async (root, relativePath, content) => {
  const path = join(root, relativePath);

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
};

const writeFixture = async (root, state) => {
  await writeText(root, "concepts.json", formatJson(state.concepts));

  await Promise.all(
    [...state.files].map(([relativePath, content]) =>
      writeText(root, relativePath, content),
    ),
  );

  await Promise.all(
    state.lessons.map(({ dir, lesson }) =>
      writeText(root, join(dir, "lesson.json"), formatJson(lesson)),
    ),
  );
};

const runValidator = (root) =>
  new Promise((resolve) => {
    execFile(
      process.execPath,
      [VALIDATOR_PATH],
      {
        cwd: FRONTEND_DIR,
        env: {
          ...process.env,
          LESSONS_ROOT_OVERRIDE: root,
        },
      },
      (error, stdout, stderr) => {
        resolve({
          code: validatorExitCode(error),
          output: validatorOutput(error, stdout, stderr),
        });
      },
    );
  });

const validatorExitCode = (error) => error?.code ?? 0;

const validatorOutput = (error, stdout, stderr) => {
  const output = `${stdout}${stderr}`;

  return output.length > 0 ? output : error?.message ?? "";
};

const failFixtureCase = (message, root, result) => {
  throw new Error(`${message}; root=${root}\n${JSON.stringify(result.output)}`);
};

const assertExitMatches = (name, root, result, expectPass) => {
  const passed = result.code === 0;

  if (passed !== expectPass) {
    failFixtureCase(
      `${name} expected pass=${expectPass} but got ${result.code}`,
      root,
      result,
    );
  }
};

const assertOutputIncludes = (name, root, result, expectedOutput) => {
  if (!expectedOutput || result.output.includes(expectedOutput)) {
    return;
  }

  failFixtureCase(
    `${name} missing output ${expectedOutput}; code=${result.code}`,
    root,
    result,
  );
};

const runFixtureCase = async ({ name, mutate, expectPass, expectedOutput }) => {
  const root = await mkdtemp(join(tmpdir(), "rust-daily-source-validation-"));

  try {
    const state = cloneState(createFixtureState());

    await mutate?.(state);
    await writeFixture(root, state);

    const result = await runValidator(root);

    assertExitMatches(name, root, result, expectPass);
    assertOutputIncludes(name, root, result, expectedOutput);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
};

const cases = [
  {
    name: "valid fixture passes",
    expectPass: true,
  },
  {
    name: "contrived scenario fails",
    expectPass: false,
    expectedOutput: "fixture-001 scenario must describe plausible project work",
    mutate: (state) => {
      state.lessons[0].lesson.scenario = "Practice this syntax in isolation.";
    },
  },
  {
    name: "raw tuple detour after domain type fails",
    expectPass: false,
    expectedOutput: "fixture-002 uses raw key/value collection after fixture-001 introduced domain type Config",
    mutate: applyRawTupleDetourFixture,
  },
  {
    name: "intentional raw boundary note passes",
    expectPass: true,
    mutate: (state) => {
      applyRawTupleDetourFixture(state);
      state.files.set(
        "fixture-arc/002-next/notes.md",
        `${notes}\nIntentional raw boundary: this lesson models adapter input before conversion.\n`,
      );
    },
  },
  {
    name: "zero editable files fail",
    expectPass: false,
    expectedOutput: "fixture-001 must have exactly one editable file.",
    mutate: (state) => {
      state.lessons[0].lesson.files[0].role = "readonly";
    },
  },
  {
    name: "two editable files fail",
    expectPass: false,
    expectedOutput: "fixture-001 must have exactly one editable file.",
    mutate: (state) => {
      state.lessons[0].lesson.files.splice(1, 0, {
        path: "src/extra.rs",
        role: "editable",
        sourcePath: "starter/src/extra.rs",
      });
      state.files.set("fixture-arc/001-greet/starter/src/extra.rs", "pub fn extra() {}\n");
    },
  },
  {
    name: "unsafe source path fails",
    expectPass: false,
    expectedOutput: "sourcePath ../outside.rs must be normalized, relative, and safe.",
    mutate: (state) => {
      state.lessons[0].lesson.files[0].sourcePath = "../outside.rs";
    },
  },
  {
    name: "directory source path fails",
    expectPass: false,
    expectedOutput: "fixture-001 src/lib.rs sourcePath starter/src must reference a file.",
    mutate: (state) => {
      state.lessons[0].lesson.files[0].sourcePath = "starter/src";
    },
  },
  {
    name: "inline content fails",
    expectPass: false,
    expectedOutput: "fixture-001 file src/lib.rs must use sourcePath instead of inline content.",
    mutate: (state) => {
      state.lessons[0].lesson.files[0].content = lessonOneSolution;
    },
  },
  {
    name: "unknown nested fields fail",
    expectPass: false,
    expectedOutput: "file 1 has unknown field unexpected",
    mutate: (state) => {
      state.lessons[0].lesson.files[0].unexpected = true;
    },
  },
  {
    name: "test role with src path fails",
    expectPass: false,
    expectedOutput: "fixture-001 test file src/helper.rs must be under tests/**/*.rs.",
    mutate: (state) => {
      state.lessons[0].lesson.files[1].path = "src/helper.rs";
    },
  },
  {
    name: "editable test path fails",
    expectPass: false,
    expectedOutput: "fixture-001 editable file tests/public.rs must be under src/**/*.rs.",
    mutate: (state) => {
      state.lessons[0].lesson.files[0].path = "tests/public.rs";
    },
  },
  {
    name: "final hint mismatch fails",
    expectPass: false,
    expectedOutput: "fixture-001 final hint solutionCode must match author solution for src/lib.rs.",
    mutate: (state) => {
      state.lessons[0].lesson.hints[2].solutionCode = "pub fn wrong() {}\n";
    },
  },
  {
    name: "non-final solutionCode fails",
    expectPass: false,
    expectedOutput: "fixture-001 hint 1 must not define solutionCode.",
    mutate: (state) => {
      state.lessons[0].lesson.hints[0].solutionCode = lessonOneSolution;
    },
  },
  {
    name: "non-default editable path instructions fail",
    expectPass: false,
    expectedOutput: "fixture-002 instructions must name editable file src/next.rs.",
    mutate: (state) => {
      state.lessons[1].lesson.instructions = "Add next.";
    },
  },
  {
    name: "readonly previous solution drift fails",
    expectPass: false,
    expectedOutput: "fixture-002 readonly file src/lib.rs must match previous lesson fixture-001 authored solution.",
    mutate: (state) => {
      state.files.set("fixture-arc/002-next/starter/src/lib.rs", "pub fn drift() {}\n");
    },
  },
  {
    name: "structural checks target editable file",
    expectPass: false,
    expectedOutput: "fixture-002 structural check source_includes must pass against editable file src/next.rs.",
    mutate: (state) => {
      state.lessons[1].lesson.validation.validations[0].checks[0].requiredSnippets = [
        "pub fn greet",
      ];
    },
  },
  {
    name: "compile-fail duplicate target still fails",
    expectPass: false,
    expectedOutput: "fixture-001 has duplicate compile-fail generated target a_b.",
    mutate: (state) => {
      state.lessons[0].lesson.validation.validations.push({
        mode: "backend-compile-fail",
        timeoutMs: 10000,
        dependencySet: "std",
        cases: [
          {
            name: "a-b",
            sourcePath: "compile_fail/one.rs",
            expectedDiagnostics: ["expected"],
          },
          {
            name: "a_b",
            sourcePath: "compile_fail/two.rs",
            expectedDiagnostics: ["expected"],
          },
        ],
      });
      state.files.set("fixture-arc/001-greet/compile_fail/one.rs", "fn main() {}\n");
      state.files.set("fixture-arc/001-greet/compile_fail/two.rs", "fn main() {}\n");
    },
  },
];

for (const testCase of cases) {
  await runFixtureCase(testCase);
  console.log(`ok - ${testCase.name}`);
}
