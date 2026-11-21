import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { decodePlaygroundLesson } from "../../../frontend/src/playground/lessonPayload.ts";

const script = fileURLToPath(new URL("./link.mjs", import.meta.url));
const run = (args, input) => spawnSync(process.execPath, [script, ...args], { input, encoding: "utf8" });
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
  hints: [{ level: 1, body: "Use a tuple struct." }],
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

test("rejects malformed, corrupted and structurally invalid links", () => {
  const invalidLessons = [
    { ...lesson, starterCode: "different" },
    { ...lesson, files: [{ ...lesson.files[0], path: "src/../lib.rs" }] },
    { ...lesson, files: [{ ...lesson.files[0], path: "src/main.rs" }] },
    { ...lesson, validation: { mode: "structural", timeoutMs: 1, checks: [{ type: "toString" }] } },
    { ...lesson, validation: { mode: "backend-cargo-test", timeoutMs: 1 } },
    { ...lesson, hints: [{ level: 2, body: "hint" }] },
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
