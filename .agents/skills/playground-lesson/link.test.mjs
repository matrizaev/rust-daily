import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import { decodePlaygroundLesson } from "../../../frontend/src/playground/lessonPayload.ts";

const skillPath = fileURLToPath(new URL("./SKILL.md", import.meta.url));
const skill = readFileSync(skillPath, "utf8");
const embeddedTool = skill.match(
  /<!-- link-tool:start -->\r?\n```js\r?\n([\s\S]*?)\r?\n```\r?\n<!-- link-tool:end -->/,
);
assert.ok(embeddedTool, "SKILL.md must contain the embedded link tool");
const tempDir = mkdtempSync(join(tmpdir(), "rust-daily-link-test-"));
const script = join(tempDir, "link.mjs");
writeFileSync(script, embeddedTool[1]);
after(() => rmSync(tempDir, { recursive: true, force: true }));

const run = (args, input) => spawnSync(process.execPath, [script, ...args], { input, encoding: "utf8" });
const runAsync = (args) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [script, ...args]);
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
  child.on("error", reject);
  child.on("close", (status) => resolve({ status, stdout, stderr }));
});
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
const urlFor = (value) => `https://borrowquest.site/#playground?lesson=${encode(value)}`;
const payloadFrom = (link) => new URLSearchParams(new URL(link).hash.slice("#playground?".length)).get("lesson");

const lesson = {
  schemaVersion: 2,
  id: "shared-score",
  arcId: "playground",
  arcTitle: "Playground",
  order: 1,
  day: 1,
  arcLength: 1,
  title: "Create a score type",
  conceptId: "newtypes",
  difficulty: "easy",
  estimatedMinutes: 5,
  scenario: "La puntuación necesita un tipo propio.",
  instructions: "Add the score type.",
  starterCode: "pub struct Score(pub u32);\n",
  files: [{ path: "src/lib.rs", role: "editable", content: "pub struct Score(pub u32);\n" }],
  hints: [
    { level: 1, body: "Use a tuple struct." },
    { level: 2, body: "Give the tuple field the score's numeric type." },
    {
      level: 3,
      body: "A tuple struct creates a distinct type.",
      solutionCode: "pub struct Score(pub u32);\n",
    },
  ],
  completionExplanation: "The score now has a distinct type.",
  validation: { mode: "structural", timeoutMs: 1000, checks: [{ type: "source_includes", requiredSnippets: ["struct Score"] }] },
};

test("generates deterministic UTF-8 links accepted by the app and verifies the exact link", () => {
  const first = run(["generate", "-"], JSON.stringify(lesson));
  const second = run(["generate", "-"], JSON.stringify(lesson, null, 2));
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, second.stdout);
  const link = first.stdout.trim();
  assert.equal(new URL(link).origin, "https://borrowquest.site");
  assert.deepEqual(decodePlaygroundLesson(payloadFrom(link)).lesson, lesson);
  assert.equal(run(["verify", "-"], link).status, 0);
  assert.match(run(["generate", "-", "--origin", "http://localhost:5173"], JSON.stringify(lesson)).stdout, /^http:\/\/localhost:5173\/#playground\?lesson=/);
  assert.notEqual(run(["generate", "-", "--origin", "https://example.com/path"], JSON.stringify(lesson)).status, 0);
});

test("accepts supported backend and combined validation configurations", () => {
  const testFile = { path: "tests/lesson.rs", role: "test", content: "#[test] fn works() {}" };
  const cases = [{ name: "bad", path: "compile_fail/bad.rs", content: "", expectedDiagnostics: ["error"] }];
  for (const validation of [
    { mode: "self-check" },
    { mode: "backend-cargo-test", timeoutMs: 10000, testCode: testFile.content },
    { mode: "backend-compile-fail", timeoutMs: 10000, cases },
    { mode: "all", validations: [lesson.validation, { mode: "backend-cargo-test", timeoutMs: 10000 }] },
  ]) {
    const value = { ...lesson, files: [...lesson.files, testFile], validation };
    const result = run(["generate", "-"], JSON.stringify(value));
    assert.equal(result.status, 0, result.stderr);
    assert.equal(decodePlaygroundLesson(payloadFrom(result.stdout.trim())).ok, true);
  }
});

test("tests the level-three solution through the backend before emitting a link", async (t) => {
  let submitted;
  let outcomeStatus = "passed";
  const server = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    submitted = {
      method: request.method,
      url: request.url,
      body: JSON.parse(Buffer.concat(chunks).toString("utf8")),
    };
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      status: outcomeStatus,
      stdout: "",
      stderr: outcomeStatus === "passed" ? "" : "assertion failed",
      duration_ms: 4,
    }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve, reject) => {
    server.close((error) => error ? reject(error) : resolve());
  }));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  const backendUrl = `http://127.0.0.1:${address.port}`;
  const lessonFile = join(tempDir, "backend-lesson.json");
  const backendLesson = {
    ...lesson,
    files: [
      ...lesson.files,
      { path: "tests/lesson.rs", role: "test", content: "#[test] fn works() {}" },
    ],
    validation: { mode: "backend-cargo-test", timeoutMs: 10000, dependencySet: "std" },
  };
  writeFileSync(lessonFile, JSON.stringify(backendLesson));

  const result = await runAsync([
    "generate",
    lessonFile,
    "--origin",
    "https://playground.example",
    "--backend-url",
    backendUrl,
    "--test-solution",
  ]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^https:\/\/playground\.example\/#playground\?lesson=/);
  assert.match(result.stderr, /Solution passed 1 backend check/);
  assert.equal(submitted.method, "POST");
  assert.equal(submitted.url, "/run");
  assert.equal(submitted.body.mode, "cargo-test");
  assert.equal(submitted.body.dependencySet, "std");
  assert.deepEqual(submitted.body.files, [
    { path: "src/lib.rs", content: backendLesson.hints[2].solutionCode },
    { path: "tests/lesson.rs", content: "#[test] fn works() {}" },
  ]);

  outcomeStatus = "failed";
  const failed = await runAsync([
    "generate",
    lessonFile,
    "--origin",
    backendUrl,
    "--test-solution",
  ]);
  assert.notEqual(failed.status, 0);
  assert.equal(failed.stdout, "");
  assert.match(failed.stderr, /Solution check 1 failed:.*assertion failed/s);

  outcomeStatus = "passed";
  const compileFailLesson = {
    ...backendLesson,
    validation: {
      mode: "backend-compile-fail",
      timeoutMs: 10000,
      cases: [{
        name: "private-score-field",
        path: "compile_fail/private_score_field.rs",
        content: "use rust_daily_lesson::Score;\nfn main() { let _ = Score(1).0; }\n",
        expectedDiagnostics: ["private field"],
      }],
    },
  };
  writeFileSync(lessonFile, JSON.stringify(compileFailLesson));
  const compileFail = await runAsync([
    "generate",
    lessonFile,
    "--origin",
    backendUrl,
    "--test-solution",
  ]);
  assert.equal(compileFail.status, 0, compileFail.stderr);
  assert.equal(submitted.body.mode, "compile-fail");
  assert.equal(submitted.body.compileFailCases[0].name, "private-score-field");
});

test("rejects malformed, corrupted and structurally invalid links", () => {
  const invalidLessons = [
    { ...lesson, starterCode: "different" },
    { ...lesson, files: [{ ...lesson.files[0], path: "src/../lib.rs" }] },
    { ...lesson, files: [{ ...lesson.files[0], path: "src/main.rs" }] },
    { ...lesson, validation: { mode: "structural", timeoutMs: 1, checks: [{ type: "toString" }] } },
    { ...lesson, validation: { mode: "backend-cargo-test", timeoutMs: 1 } },
    { ...lesson, hints: [{ level: 2, body: "hint" }] },
    {
      ...lesson,
      hints: [
        { level: 1, body: "hint one" },
        { level: 2, body: "hint two" },
        { level: 3, body: "hint three" },
      ],
    },
  ];
  for (const value of invalidLessons) {
    const result = run(["generate", "-"], JSON.stringify(value));
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /Error:/);
    assert.notEqual(run(["verify", "-"], urlFor(value)).status, 0);
  }
  for (const link of [
    "https://borrowquest.site/#playground?lesson=%%%",
    `${urlFor(lesson)}&lesson=other`,
    `https://borrowquest.site/#lesson?lesson=${encode(lesson)}`,
    `https://borrowquest.site/#playground?lesson=${Buffer.from([0xff]).toString("base64url")}`,
    `${urlFor(lesson).slice(0, -1)}`,
  ]) {
    assert.notEqual(run(["verify", "-"], link).status, 0);
  }
});

test("enforces the exact 32 KiB UTF-8 payload limit", () => {
  const base = { ...lesson, scenario: "é" };
  const atLimit = { ...base, scenario: base.scenario + "x".repeat(32 * 1024 - Buffer.byteLength(JSON.stringify(base))) };
  const result = run(["generate", "-"], JSON.stringify(atLimit));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(decodePlaygroundLesson(payloadFrom(result.stdout.trim())).ok, true);
  const tooLarge = { ...atLimit, scenario: atLimit.scenario + "é" };
  assert.notEqual(run(["generate", "-"], JSON.stringify(tooLarge)).status, 0);
  assert.notEqual(run(["verify", "-"], urlFor(tooLarge)).status, 0);
});
