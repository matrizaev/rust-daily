import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = join(SCRIPT_DIR, "..", "..");
const SCAFFOLDER_PATH = join(SCRIPT_DIR, "scaffold-lesson.mjs");
const SOURCE_VALIDATOR_PATH = join(SCRIPT_DIR, "validate-source-content.mjs");
let outputCounter = 0;

const PRESET_IDS = [
  "advanced-owned-api",
  "advanced-borrowed-api",
  "advanced-async-port",
  "advanced-actix-boundary",
  "advanced-error-mapping",
  "advanced-property-test",
  "advanced-compile-fail",
];

const NOTES_SECTIONS = [
  "## Concept Boundary",
  "## Intended Solution",
  "## Validation Strategy",
  "## Common Wrong Solutions",
  "## Arc Continuity",
  "## Review Checklist",
];

const formatJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

const pathExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const fail = (message) => {
  throw new Error(message);
};

const assert = (condition, message) => {
  if (!condition) {
    fail(message);
  }
};

const assertIncludes = (value, expected, label) => {
  assert(
    value.includes(expected),
    `${label} missing ${JSON.stringify(expected)} in ${JSON.stringify(value)}`,
  );
};

const commandOutput = (error, stdout, stderr) => {
  const output = `${stdout}${stderr}`;

  return output.length > 0 ? output : error?.message ?? "";
};

const readRedirectedOutput = async (outputPath) => {
  try {
    return await readFile(outputPath, "utf8");
  } catch {
    return "";
  } finally {
    await rm(outputPath, { force: true });
  }
};

const shellQuote = (value) => `'${String(value).replaceAll("'", "'\\''")}'`;

const runScaffold = (root, args) =>
  new Promise((resolve) => {
    const outputPath = join(
      tmpdir(),
      `rust-daily-scaffold-output-${process.pid}-${outputCounter += 1}.log`,
    );
    const command = [
      process.execPath,
      SCAFFOLDER_PATH,
      ...args,
    ].map(shellQuote).join(" ");

    execFile(
      "/bin/bash",
      ["-lc", `${command} > ${shellQuote(outputPath)} 2>&1`],
      {
        cwd: FRONTEND_DIR,
        env: {
          ...process.env,
          LESSONS_ROOT_OVERRIDE: root,
        },
      },
      async (error, stdout, stderr) => {
        const redirectedOutput = await readRedirectedOutput(outputPath);

        resolve({
          code: error?.code ?? 0,
          output: redirectedOutput || commandOutput(error, stdout, stderr),
        });
      },
    );
  });

const runSourceValidation = (root) =>
  new Promise((resolve) => {
    execFile(
      process.execPath,
      [SOURCE_VALIDATOR_PATH],
      {
        cwd: FRONTEND_DIR,
        env: {
          ...process.env,
          LESSONS_ROOT_OVERRIDE: root,
        },
      },
      (error, stdout, stderr) => {
        resolve({
          code: error?.code ?? 0,
          output: commandOutput(error, stdout, stderr),
        });
      },
    );
  });

const createRoot = async () => {
  const root = await mkdtemp(join(tmpdir(), "rust-daily-scaffold-"));

  await writeFile(join(root, "arcs.json"), formatJson([]));
  await writeFile(join(root, "concepts.json"), formatJson([]));

  return root;
};

const withRoot = async (callback) => {
  const root = await createRoot();

  try {
    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
};

const slugForPreset = (presetId) => presetId.replace("advanced-", "");

const lessonDir = (root, presetId) => join(root, "fixture-arc", `001-${slugForPreset(presetId)}`);

const scaffoldArgs = (presetId, { extra = [], register = true } = {}) => [
  "--preset",
  presetId,
  "--arc",
  "fixture-arc",
  "--lesson",
  `001-${slugForPreset(presetId)}`,
  "--title",
  `Fixture ${slugForPreset(presetId)}`,
  "--concept",
  `fixture-${slugForPreset(presetId)}`,
  "--difficulty",
  "advanced",
  "--editable",
  "src/lib.rs",
  ...(register
    ? [
        "--register-arc",
        "--arc-title",
        "Fixture Arc",
        "--arc-pillar",
        "advanced",
        "--arc-description",
        "Fixture advanced lessons.",
        "--register-concept",
      ]
    : []),
  ...extra,
];

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const lessonJsonForPreset = async (root, presetId) =>
  readJson(join(lessonDir(root, presetId), "lesson.json"));

const validationSteps = (lesson) =>
  lesson.validation?.mode === "all" ? lesson.validation.validations : [lesson.validation];

const backendStep = (lesson) =>
  validationSteps(lesson).find((step) => step?.mode === "backend-cargo-test");

const hasValidationMode = (lesson, mode) =>
  validationSteps(lesson).some((step) => step?.mode === mode);

const assertSuccessfulScaffold = async (root, presetId) => {
  const result = await runScaffold(root, scaffoldArgs(presetId));

  assert(result.code === 0, `${presetId} scaffold failed:\n${result.output}`);
  assertIncludes(result.output, `Preset: ${presetId}`, `${presetId} output`);
};

const assertCommonLessonShape = async (root, presetId) => {
  const lesson = await lessonJsonForPreset(root, presetId);
  const editableFiles = lesson.files.filter((file) => file.role === "editable");
  const testFiles = lesson.files.filter((file) => file.role === "test");
  const backend = backendStep(lesson);
  const notes = await readFile(join(lessonDir(root, presetId), "notes.md"), "utf8");
  const solution = await readFile(
    join(lessonDir(root, presetId), "solution", editableFiles[0]?.path ?? "src/lib.rs"),
    "utf8",
  );
  const finalHint = lesson.hints.at(-1);

  assert(editableFiles.length === 1, `${presetId} must have one editable file`);
  assert(editableFiles[0].path === "src/lib.rs", `${presetId} editable path mismatch`);
  assert(
    finalHint?.solutionCode === solution,
    `${presetId} final hint solutionCode must match generated solution`,
  );
  assert(
    testFiles.some((file) => file.path === "tests/public.rs"),
    `${presetId} must include tests/public.rs in files`,
  );
  assert(backend, `${presetId} must include backend Cargo validation`);
  assert(
    backend.testFiles.some((file) => file.path === "tests/public.rs"),
    `${presetId} must include tests/public.rs in backend validation`,
  );

  NOTES_SECTIONS.forEach((section) => {
    assertIncludes(notes, section, `${presetId} notes`);
  });
};

const testListPresets = async () => {
  const result = await runScaffold(join(tmpdir(), "missing-rust-daily-lessons"), [
    "--list-presets",
  ]);

  assert(result.code === 0, `--list-presets failed:\n${result.output}`);
  PRESET_IDS.forEach((presetId) => assertIncludes(result.output, presetId, "--list-presets"));
};

const testHelp = async () => {
  const result = await runScaffold(join(tmpdir(), "missing-rust-daily-lessons"), ["--help"]);

  assert(result.code === 0, `--help failed:\n${result.output}`);
  assertIncludes(result.output, "--arc <arc-id>", "--help");
  PRESET_IDS.forEach((presetId) => assertIncludes(result.output, presetId, "--help"));
};

const testUnknownPreset = () =>
  withRoot(async (root) => {
    const result = await runScaffold(root, [
      ...scaffoldArgs("missing-preset", {
        extra: ["--dependency-set", "std"],
      }),
    ]);

    assert(result.code !== 0, "unknown preset should fail");
    assertIncludes(result.output, "Accepted presets:", "unknown preset output");
    assertIncludes(result.output, "advanced-owned-api", "unknown preset output");
    assert(
      !(await pathExists(join(root, "fixture-arc"))),
      "unknown preset should not write lesson directory",
    );
  });

const testDependencyMismatchNoWrite = () =>
  withRoot(async (root) => {
    const result = await runScaffold(root, [
      ...scaffoldArgs("advanced-async-port", {
        extra: ["--dependency-set", "std"],
      }),
    ]);

    assert(result.code !== 0, "dependency mismatch should fail");
    assertIncludes(
      result.output,
      "advanced-async-port allows dependency sets: advanced.",
      "dependency mismatch output",
    );
    assert(
      !(await pathExists(lessonDir(root, "advanced-async-port"))),
      "dependency mismatch should not write lesson directory",
    );
  });

const presetSpecificAssertions = {
  "advanced-owned-api": async ({ lesson, publicTest }) => {
    assert(hasValidationMode(lesson, "structural"), "owned preset needs structural validation");
    assertIncludes(publicTest, "ApiRequest", "owned public test");
  },
  "advanced-borrowed-api": async ({ lesson, publicTest }) => {
    assert(hasValidationMode(lesson, "structural"), "borrowed preset needs structural validation");
    assertIncludes(publicTest, "ConfigDocument", "borrowed public test");
  },
  "advanced-async-port": async ({ lesson, publicTest }) => {
    assert(backendStep(lesson).dependencySet === "advanced", "async preset needs advanced deps");
    assertIncludes(publicTest, "#[tokio::test]", "async public test");
  },
  "advanced-actix-boundary": async ({ lesson, publicTest }) => {
    assert(backendStep(lesson).dependencySet === "advanced", "Actix preset needs advanced deps");
    assertIncludes(publicTest, "#[actix_rt::test]", "Actix public test");
  },
  "advanced-error-mapping": async ({ lesson }) => {
    assert(
      backendStep(lesson).dependencySet === "advanced",
      "error mapping preset needs advanced deps",
    );
    assert(
      hasValidationMode(lesson, "structural"),
      "error mapping preset needs structural validation",
    );
  },
  "advanced-property-test": async ({ lesson, publicTest }) => {
    assert(backendStep(lesson).dependencySet === "advanced", "property preset needs advanced deps");
    assertIncludes(publicTest, "proptest!", "property public test");
  },
  "advanced-compile-fail": async ({ lesson, root, presetId }) => {
    assert(
      hasValidationMode(lesson, "backend-compile-fail"),
      "compile-fail preset needs compile-fail validation",
    );
    assert(
      await pathExists(join(lessonDir(root, presetId), "compile_fail/public_contract.rs")),
      "compile-fail preset needs public contract case",
    );
  },
};

const assertPresetSpecifics = async (root, presetId) => {
  const lesson = await lessonJsonForPreset(root, presetId);
  const publicTest = await readFile(join(lessonDir(root, presetId), "tests/public.rs"), "utf8");

  await presetSpecificAssertions[presetId]({
    lesson,
    publicTest,
    root,
    presetId,
  });
};

const assertSourceValidationPasses = async (root, presetId) => {
  const result = await runSourceValidation(root);

  assert(result.code === 0, `${presetId} source validation failed:\n${result.output}`);
};

const testPreset = (presetId) =>
  withRoot(async (root) => {
    await assertSuccessfulScaffold(root, presetId);
    await assertCommonLessonShape(root, presetId);
    await assertPresetSpecifics(root, presetId);
    await assertSourceValidationPasses(root, presetId);
  });

const testForceOverwriteProtection = () =>
  withRoot(async (root) => {
    const presetId = "advanced-owned-api";

    await assertSuccessfulScaffold(root, presetId);
    await writeFile(join(lessonDir(root, presetId), "starter/src/lib.rs"), "pub fn locked() {}\n");

    const result = await runScaffold(root, [
      ...scaffoldArgs(presetId, {
        extra: ["--force"],
        register: false,
      }),
    ]);

    assert(result.code !== 0, "--force should reject non-placeholder protected files");
    assertIncludes(
      result.output,
      "does not contain TODO(author):; refusing to overwrite",
      "force overwrite output",
    );
  });

const cases = [
  ["list presets", testListPresets],
  ["help", testHelp],
  ["unknown preset", testUnknownPreset],
  ["dependency mismatch writes nothing", testDependencyMismatchNoWrite],
  ...PRESET_IDS.map((presetId) => [`preset ${presetId}`, () => testPreset(presetId)]),
  ["force overwrite protection", testForceOverwriteProtection],
];

for (const [name, run] of cases) {
  await run();
  console.log(`ok - ${name}`);
}
