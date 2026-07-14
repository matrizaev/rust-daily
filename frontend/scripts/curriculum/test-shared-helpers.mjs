import assert from "node:assert/strict";
import { join } from "node:path";
import {
  assertIncludes,
  withTempRoot,
  writeText,
} from "./test-support.mjs";
import {
  validateDiagnosticAggregateByteLimit,
  validateDiagnosticSnippetLimits,
  validateRunnerPathLimits,
} from "./lib/diagnostics.mjs";
import {
  duplicateValues,
  lessonStarterCode,
  sortRecordsByOrderThenId,
  validateHintObject,
} from "./lib/lesson-helpers.mjs";
import {
  isCompileFailPath,
  isRunnerPath,
  isSafeRelativePath,
  isTestFilePath,
} from "./lib/path-rules.mjs";
import {
  inlineCompileFailValidation,
  readSourceText,
} from "./lib/source-files.mjs";

const withTempLesson = async (callback) => {
  await withTempRoot("rust-daily-shared-helpers-", async (root) => {
    await writeText(root, "lesson.json", "{}\n");
    await callback(root, join(root, "lesson.json"));
  });
};

const testPathRules = () => {
  assert.equal(isSafeRelativePath("src/lib.rs"), true);
  assert.equal(isSafeRelativePath("../src/lib.rs"), false);
  assert.equal(isSafeRelativePath("src\\lib.rs"), false);
  assert.equal(isRunnerPath("fixtures/config.json"), true);
  assert.equal(isTestFilePath("tests/public.rs"), true);
  assert.equal(isTestFilePath("src/public.rs"), false);
  assert.equal(isCompileFailPath("compile_fail/lifetime.rs"), true);
  assert.equal(isCompileFailPath("compile_fail/lifetime.txt"), false);
};

const testDiagnostics = () => {
  const errors = [];

  assert.equal(validateRunnerPathLimits(errors, "lesson", "src/lib.rs", "path"), true);
  assert.equal(validateRunnerPathLimits(errors, "lesson", `${"a".repeat(241)}.rs`, "path"), false);
  validateDiagnosticSnippetLimits(errors, "case", ["same", " same "], []);
  validateDiagnosticSnippetLimits(errors, "case", ["same"], ["same"]);
  validateDiagnosticAggregateByteLimit(errors, "case", ["x".repeat(8193)]);

  assertIncludes(errors, "exceeds 240 bytes", "runner path diagnostics");
  assertIncludes(errors, "must be unique after trimming", "duplicate diagnostic snippets");
  assertIncludes(errors, "cannot both expect and forbid", "conflicting diagnostic snippets");
  assertIncludes(errors, "exceed 8192 bytes", "aggregate diagnostic snippets");
};

const testLessonHelpers = () => {
  const errors = [];

  assert.deepEqual(duplicateValues(["a", "b", "a", "c", "b"]), ["a", "b"]);
  assert.deepEqual(
    sortRecordsByOrderThenId([
      { id: "b", order: 2 },
      { id: "a", orderStart: 1 },
      { id: "c", order: 1 },
    ]).map((record) => record.id),
    ["a", "c", "b"],
  );
  assert.equal(lessonStarterCode({ starterCode: "legacy" }), "legacy");
  assert.equal(
    lessonStarterCode({
      files: [
        { role: "readonly", content: "readonly" },
        { role: "editable", content: "editable" },
      ],
    }),
    "editable",
  );

  validateHintObject(errors, "lesson-001", "hint", 0, { allowString: true });
  validateHintObject(errors, "lesson-001", { level: 2, body: "" }, 0);
  validateHintObject(errors, "lesson-001", { level: 1, body: "ok", solutionCode: 1 }, 0);

  assertIncludes(errors, "must use level 1", "hint level");
  assertIncludes(errors, "must have body", "hint body");
  assertIncludes(errors, "solutionCode must be a string", "hint solution");
};

const testSourceFiles = () =>
  withTempLesson(async (root, lessonJsonPath) => {
    await writeText(root, "src/lib.rs", "pub fn answer() -> u8 { 42 }\n");
    await writeText(root, "compile_fail/public.rs", "fn main() {}\n");

    assert.equal(
      await readSourceText(lessonJsonPath, "src/lib.rs"),
      "pub fn answer() -> u8 { 42 }\n",
    );
    await assert.rejects(
      () => readSourceText(lessonJsonPath, "../outside.rs"),
      /not a safe relative source path/,
    );
    const inlined = await inlineCompileFailValidation(lessonJsonPath, {
      mode: "backend-compile-fail",
      cases: [
        {
          name: "public",
          sourcePath: "compile_fail/public.rs",
          expectedDiagnostics: ["expected"],
        },
      ],
    });

    assert.deepEqual(inlined.cases, [
      {
        name: "public",
        path: "compile_fail/public.rs",
        content: "fn main() {}\n",
        expectedDiagnostics: ["expected"],
      },
    ]);
  });

const cases = [
  ["path rules", testPathRules],
  ["diagnostics", testDiagnostics],
  ["lesson helpers", testLessonHelpers],
  ["source files", testSourceFiles],
];

for (const [name, run] of cases) {
  await run();
  console.log(`ok - ${name}`);
}
