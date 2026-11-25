---
name: playground-lesson
description: "Use when asked to design, author, encode, or share an ad-hoc Rust Daily Playground lesson link."
---

# Playground Lesson Authoring

Create a complete public Rust Daily lesson payload from the user's request and
turn it into a link that opens the lesson in Playground. This workflow does not
add the lesson to any curriculum. This skill is self-contained: it must work
without access to a Rust Daily source checkout or its documentation.
The link verifier is embedded below, so this skill needs only `SKILL.md` and
Node.js 18 or newer; it has no external package dependencies.

## Payload Contract

Create one JSON object with the complete public lesson fields:

- `schemaVersion`: number selecting the lesson data format; use `2`.
- `id`: non-empty, stable lesson identifier. It is not a curriculum or draft
   identity in Playground; use a descriptive slug such as `parse-user-email`.
- `arcId`: non-empty identifier grouping related curriculum lessons. An
   ad-hoc lesson has no curriculum group, so use `playground`.
- `arcTitle`: non-empty display title for that group. Use `Playground` for an
   ad-hoc lesson.
- `order`: finite number giving the lesson's position in its group. Use `1`
   for a standalone lesson.
- `day`: positive integer curriculum day. Use `1` for a standalone lesson.
- `arcLength`: positive integer count of lessons in the group. Use `1` for a
   standalone lesson.
- `title`: non-empty, learner-facing lesson title.
- `conceptId`: non-empty Rust concept label. Playground may display this value
   directly, so make it readable (for example, `error-handling`), not opaque.
- `difficulty`: expected level: `easy`, `medium`, or `advanced`.
- `estimatedMinutes`: number from 5 through 10 for expected learner effort.
- `scenario`: non-empty context explaining why the task exists.
- `instructions`: non-empty, concrete change the learner must make.
- `starterCode`: string containing the initial editable source. It must match
   the editable file's `content` exactly.
- `files`: non-empty array of `{ "path", "role", "content" }`; roles are
  `editable`, `readonly`, or `test`.
- `hints`: array of one to three progressive hints. Each has a numeric,
   sequential `level` starting at 1, a non-empty learner-visible `body`, and
   optional string `solutionCode` shown with that hint.
- `completionExplanation`: non-empty learner-facing explanation shown after
   checks pass.
- `validation`: the check configuration described below; required for a valid
   shared lesson.

For lessons authored with this skill, include exactly three hints. Hint 3 must
include `solutionCode` containing the complete intended solution for the
editable file. This lets `--test-solution` run the authored answer against the
lesson's backend checks without adding solution-only fields to the public
payload.

Each file's `path`, `role`, and `content` must be strings. Include exactly one
`editable` file: learner's source file. A `readonly` file supplies context that
learners can read but not edit. A `test` file supplies Rust tests to backend
validation. Roles control workspace treatment, not secrecy: all file content
is part of public, inspectable lesson payload. Paths must be relative, unique, and
traversal-free. Supported project paths are Rust files under `src/` or `tests/`,
plus files under `fixtures/` or `testdata/`. Never include manifests, runner
commands, or custom runner configuration in the payload. Do not include
author-only metadata, notes, solution paths, or fields outside the public lesson
shape above.

## Validation Modes

Validation modes specify what Playground checks when learner runs validation.
Only backend modes compile or execute Rust. Browser structural checks are quick
source checks; self-check is not an automated correctness check. Validation
configuration and tests are included in public payload and can be inspected or
changed by recipients.

- Both explicit backend modes require `src/lib.rs` and at least one Rust test
  target under `tests/`. A test target can come from a `test` lesson file,
  `testFiles`, or `testCode`. If there is no explicit backend mode, Playground
  adds a default compile-smoke test: it checks that the library compiles but
  asserts no lesson behavior. This default also applies to structural-only and
  self-check-only lessons, so every lesson must include `src/lib.rs`.
- `structural`: finite positive `timeoutMs` and one or more checks. Checks run
  against the single editable file only, not readonly or test files. They are
  small text/regex source-matching functions, not a Rust parser, compiler, or
  behavior test. They can accept invalid Rust and can reject semantically
  equivalent syntax. Specify the source form being required; do not expect a
  check to infer omitted generic arguments or equivalent spellings. Line and
  block comments are ignored by most checks; `source_includes.requiredSnippets`
  searches raw source, so a required snippet can match inside a comment.

  Available checks:
  - `enum_unit_variants` (`enumName`, `requiredVariants`): find named enum and
    check for each required variant name. Unit, tuple, and struct variants all
    count; payload shape is not checked.
  - `struct_fields` (`structName`, `requiredFields`): find named-field struct;
    each field entry has `name` and `typeIncludes`. Every listed type string must
    occur in that field's type text. This is substring matching, not exact type
    equality.
  - `tuple_struct_fields` (`structName`, `requiredTypes`): find tuple struct;
    array length requires exact field count, and each entry checks corresponding
    field type by substring, in order.
  - `impl_trait_for_type` (`traitName`, `typeName`): find explicit `impl Trait for
    Type` and compare trait reference. Whitespace and path qualification are
    normalized; generic arguments remain significant and must be included when
    required. Does not check implementation behavior.
  - `derived_trait_for_type` (`traitName`, `typeName`): check that named struct
    or enum has a `derive` attribute listing the trait. Does not count a manual
    trait implementation as a derive.
  - `impl_method` (`implFor`, `methodName`, `requiredSignatureIncludes`): find
    method with that name inside an inherent `impl` for the named type; every
    required string must occur in its signature. Does not inspect method body.
  - `function_signature` (`functionName`, `requiredSignatureIncludes`): find
    function by name and check that every required string occurs in its
    whitespace-normalized signature. Does not inspect function body.
  - `source_includes` (`requiredSnippets`, optional `forbiddenSnippets`): each
    required string must occur literally in editable source. Forbidden strings
    must not occur; comments are ignored for forbidden checks. Identifier-only
    forbidden values use identifier boundaries, while other values use literal
    substring matching.

  Use backend tests for requirements about Rust type checking, runtime results,
  errors, or implementation behavior.
- `backend-cargo-test`: finite positive `timeoutMs`, optional dependency set
  (`std`, `advanced`, or `advanced-db`), and optional `testCode` or `testFiles`.
  This compiles the submitted library and runs public tests with `cargo test`.
  Include a test target as a `test` lesson file, a `testFiles` entry with `path`
  and `content` string fields, or `testCode` (placed in `tests/lesson.rs` only
  when no test target already exists; otherwise `testCode` is ignored). The
  generated Cargo package is named `rust_daily_lesson`; integration tests import
  the submitted library by that name.
  `std` provides standard library only; `advanced` and `advanced-db` provide
  curated cached dependency sets, with database dependencies in `advanced-db`.
  Use `10_000` ms unless tests need longer.
- `backend-compile-fail`: finite positive `timeoutMs`, optional dependency set,
  and one to four cases with `name`, `path`, `content`, and non-empty
  `expectedDiagnostics`; `forbiddenDiagnostics` is optional. Submitted library
  must compile first. Each case is then compiled as an integration-test target
  against `rust_daily_lesson`; each must fail to compile, include every expected
  diagnostic substring, and include none of the forbidden substrings. Case
  names must be unique, 1-80 ASCII letters, digits, `_` or `-`. Case paths must
  be unique safe relative `.rs` paths under `compile_fail/`.
- `self-check`: no fields beyond `mode` required. Running it records that learner
  self-checked; it does not compile or verify the answer. Default compile-smoke
  behavior above still applies if lesson has no explicit backend mode.
- `all`: non-empty `validations` array of supported modes above; nested `all` is
  forbidden. Playground runs browser checks first, then backend checks; backend
  checks run only if browser checks pass or return `self-check`.

Do not use `browser-rust`: unsupported by Playground. Do not invent validation
modes or fields. Public tests are inspectable and editable by link recipients;
they are practice checks, not tamper-resistant grading.

## Example Payload

Adapt this complete example to the requested lesson. It uses a serializer and
reuses the starter source so the editable file matches `starterCode` exactly:

```sh
payload=$(mktemp)
node > "$payload" <<'NODE'
const starter = `pub fn timeout_seconds(configured: Option<u64>) -> u64 {
    todo!()
}
`;
const tests = `use rust_daily_lesson::timeout_seconds;

#[test]
fn configured_timeout_is_used() {
    assert_eq!(timeout_seconds(Some(45)), 45);
    assert_eq!(timeout_seconds(Some(0)), 0);
}

#[test]
fn missing_timeout_defaults_to_30() {
    assert_eq!(timeout_seconds(None), 30);
}
`;
const lesson = {
  schemaVersion: 2,
  id: "default-request-timeout",
  arcId: "playground",
  arcTitle: "Playground",
  order: 1,
  day: 1,
  arcLength: 1,
  title: "Handle a missing request timeout",
  conceptId: "option",
  difficulty: "easy",
  estimatedMinutes: 5,
  scenario: "A service needs a default request timeout when none is configured.",
  instructions: "Return the configured timeout, or 30 seconds if it is missing. Preserve an explicitly configured zero.",
  starterCode: starter,
  files: [
    { path: "src/lib.rs", role: "editable", content: starter },
    { path: "tests/lesson.rs", role: "test", content: tests },
  ],
  hints: [
    { level: 1, body: "Option is either Some(value) or None." },
    { level: 2, body: "Try match or Option::unwrap_or." },
    {
      level: 3,
      body: "One complete solution is to use unwrap_or with the default.",
      solutionCode: `pub fn timeout_seconds(configured: Option<u64>) -> u64 {
    configured.unwrap_or(30)
}
`,
    },
  ],
  completionExplanation: "Use the value in Some, or a default when it is None.",
  validation: {
    mode: "backend-cargo-test",
    timeoutMs: 10000,
    dependencySet: "std",
  },
}
process.stdout.write(JSON.stringify(lesson));
NODE
```

Pass `"$payload"` as the lesson path in the procedure below, and remove it after
generating and verifying the link.

## Embedded Link Tool

The verifier below is the complete, dependency-free link generator and
validator. Keep it embedded in this skill when sharing the skill.

<!-- link-tool:start -->
```js
#!/usr/bin/env node
import { readFileSync } from "node:fs";

const MAX_BYTES = 32 * 1024;
const DEFAULT_ORIGIN = "https://borrowquest.site";

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

function object(value, path, required, optional = []) {
  requireCondition(value !== null && typeof value === "object" && !Array.isArray(value), `${path} must be an object`);
  for (const key of required) requireCondition(Object.hasOwn(value, key), `${path}.${key} is required`);
  for (const key of Object.keys(value)) {
    requireCondition([...required, ...optional].includes(key), `${path}.${key} is not supported`);
  }
}

function string(value, path, nonempty = false) {
  requireCondition(typeof value === "string" && (!nonempty || value.trim().length > 0), `${path} must be ${nonempty ? "a non-empty string" : "a string"}`);
}

function strings(value, path, nonempty = false) {
  requireCondition(Array.isArray(value) && (!nonempty || value.length > 0), `${path} must be ${nonempty ? "a non-empty array" : "an array"}`);
  value.forEach((item, index) => string(item, `${path}[${index}]`, nonempty));
}

function safePath(value, path, project = true) {
  string(value, path, true);
  requireCondition(!value.startsWith("/") && !value.includes("\\") &&
    !/[\u0000-\u001f\u007f]/.test(value) &&
    value.split("/").every((part) => part !== "" && part !== "." && part !== ".."),
  `${path} must be a safe relative path`);
  if (project) {
    requireCondition(((value.startsWith("src/") || value.startsWith("tests/")) && value.endsWith(".rs")) ||
      value.startsWith("fixtures/") || value.startsWith("testdata/"), `${path} is not a supported project path`);
  }
}

const checks = {
  enum_unit_variants: { strings: ["enumName"], arrays: ["requiredVariants"] },
  struct_fields: { strings: ["structName"], fields: true },
  tuple_struct_fields: { strings: ["structName"], arrays: ["requiredTypes"] },
  impl_trait_for_type: { strings: ["traitName", "typeName"] },
  derived_trait_for_type: { strings: ["traitName", "typeName"] },
  impl_method: { strings: ["implFor", "methodName"], arrays: ["requiredSignatureIncludes"] },
  function_signature: { strings: ["functionName"], arrays: ["requiredSignatureIncludes"] },
  source_includes: { arrays: ["requiredSnippets"], optionalArrays: ["forbiddenSnippets"] },
};

function structuralCheck(check, path) {
  requireCondition(check !== null && typeof check === "object" && Object.hasOwn(checks, check.type), `${path}.type is not supported`);
  const spec = checks[check.type];
  const required = ["type", ...(spec.strings ?? []), ...(spec.arrays ?? []), ...(spec.fields ? ["requiredFields"] : [])];
  object(check, path, required, spec.optionalArrays);
  for (const key of spec.strings ?? []) string(check[key], `${path}.${key}`);
  for (const key of spec.arrays ?? []) strings(check[key], `${path}.${key}`);
  for (const key of spec.optionalArrays ?? []) {
    if (check[key] !== undefined) strings(check[key], `${path}.${key}`);
  }
  if (spec.fields) {
    requireCondition(Array.isArray(check.requiredFields), `${path}.requiredFields must be an array`);
    check.requiredFields.forEach((field, index) => {
      const fieldPath = `${path}.requiredFields[${index}]`;
      object(field, fieldPath, ["name", "typeIncludes"]);
      string(field.name, `${fieldPath}.name`);
      strings(field.typeIncludes, `${fieldPath}.typeIncludes`);
    });
  }
}

function validation(value, path, files, nested = false) {
  requireCondition(value !== null && typeof value === "object" && !Array.isArray(value), `${path} must be an object`);
  if (value.mode === "all") {
    requireCondition(!nested, `${path}: nested all is not supported`);
    object(value, path, ["mode", "validations"]);
    requireCondition(Array.isArray(value.validations) && value.validations.length > 0, `${path}.validations must be a non-empty array`);
    value.validations.forEach((step, index) => validation(step, `${path}.validations[${index}]`, files, true));
    return;
  }
  if (value.mode === "self-check") {
    object(value, path, ["mode"]);
    return;
  }
  requireCondition(["structural", "backend-cargo-test", "backend-compile-fail"].includes(value.mode), `${path}.mode is not supported`);
  const backend = value.mode !== "structural";
  const required = ["mode", "timeoutMs", ...(value.mode === "structural" ? ["checks"] : value.mode === "backend-compile-fail" ? ["cases"] : [])];
  const optional = backend ? ["dependencySet", ...(value.mode === "backend-cargo-test" ? ["testCode", "testFiles"] : [])] : [];
  object(value, path, required, optional);
  requireCondition(typeof value.timeoutMs === "number" && Number.isFinite(value.timeoutMs) && value.timeoutMs > 0, `${path}.timeoutMs must be a positive finite number`);
  if (!backend) {
    requireCondition(Array.isArray(value.checks) && value.checks.length > 0, `${path}.checks must be a non-empty array`);
    value.checks.forEach((check, index) => structuralCheck(check, `${path}.checks[${index}]`));
    return;
  }
  if (value.dependencySet !== undefined) requireCondition(["std", "advanced", "advanced-db"].includes(value.dependencySet), `${path}.dependencySet is not supported`);
  requireCondition(files.some((file) => file.path === "src/lib.rs"), `${path} requires src/lib.rs`);
  if (value.testCode !== undefined) string(value.testCode, `${path}.testCode`);
  if (value.testFiles !== undefined) {
    requireCondition(Array.isArray(value.testFiles), `${path}.testFiles must be an array`);
    value.testFiles.forEach((file, index) => {
      const filePath = `${path}.testFiles[${index}]`;
      object(file, filePath, ["path", "content"]);
      safePath(file.path, `${filePath}.path`);
      string(file.content, `${filePath}.content`);
    });
  }
  const hasTest = [...files, ...(value.testFiles ?? [])].some((file) => file.path.startsWith("tests/") && file.path.endsWith(".rs")) || value.testCode !== undefined;
  requireCondition(hasTest, `${path} requires a Rust test target`);
  if (value.mode === "backend-compile-fail") {
    requireCondition(Array.isArray(value.cases) && value.cases.length >= 1 && value.cases.length <= 4, `${path}.cases must contain one to four cases`);
    const names = new Set();
    const paths = new Set();
    value.cases.forEach((entry, index) => {
      const casePath = `${path}.cases[${index}]`;
      object(entry, casePath, ["name", "path", "content", "expectedDiagnostics"], ["forbiddenDiagnostics"]);
      requireCondition(typeof entry.name === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(entry.name) && !names.has(entry.name), `${casePath}.name must be valid and unique`);
      safePath(entry.path, `${casePath}.path`, false);
      requireCondition(entry.path.startsWith("compile_fail/") && entry.path.endsWith(".rs") && !paths.has(entry.path), `${casePath}.path must be unique and under compile_fail/`);
      string(entry.content, `${casePath}.content`);
      strings(entry.expectedDiagnostics, `${casePath}.expectedDiagnostics`, true);
      if (entry.forbiddenDiagnostics !== undefined) {
        strings(entry.forbiddenDiagnostics, `${casePath}.forbiddenDiagnostics`);
        entry.forbiddenDiagnostics.forEach((diagnostic, i) => string(diagnostic, `${casePath}.forbiddenDiagnostics[${i}]`, true));
      }
      names.add(entry.name);
      paths.add(entry.path);
    });
  }
}

function validateLesson(lesson) {
  const identity = ["id", "arcId", "arcTitle", "title", "conceptId", "scenario", "instructions", "completionExplanation"];
  object(lesson, "lesson", ["schemaVersion", ...identity, "order", "day", "arcLength", "difficulty", "estimatedMinutes", "starterCode", "files", "hints", "validation"]);
  requireCondition(lesson.schemaVersion === 2, "lesson.schemaVersion must be 2");
  identity.forEach((key) => string(lesson[key], `lesson.${key}`, true));
  requireCondition(typeof lesson.order === "number" && Number.isFinite(lesson.order), "lesson.order must be finite");
  for (const key of ["day", "arcLength"]) requireCondition(Number.isInteger(lesson[key]) && lesson[key] > 0, `lesson.${key} must be a positive integer`);
  requireCondition(["easy", "medium", "advanced"].includes(lesson.difficulty), "lesson.difficulty is not supported");
  requireCondition(typeof lesson.estimatedMinutes === "number" && Number.isFinite(lesson.estimatedMinutes) && lesson.estimatedMinutes >= 5 && lesson.estimatedMinutes <= 10, "lesson.estimatedMinutes must be between 5 and 10");
  string(lesson.starterCode, "lesson.starterCode");
  requireCondition(Array.isArray(lesson.files) && lesson.files.length > 0, "lesson.files must be a non-empty array");
  const paths = new Set();
  let editable = 0;
  lesson.files.forEach((file, index) => {
    const path = `lesson.files[${index}]`;
    object(file, path, ["path", "role", "content"]);
    safePath(file.path, `${path}.path`);
    requireCondition(!paths.has(file.path), `${path}.path must be unique`);
    requireCondition(["editable", "readonly", "test"].includes(file.role), `${path}.role is not supported`);
    string(file.content, `${path}.content`);
    if (file.role === "editable") {
      editable++;
      requireCondition(file.content === lesson.starterCode, `${path}.content must match starterCode`);
    }
    paths.add(file.path);
  });
  requireCondition(editable === 1, "lesson.files must contain exactly one editable file");
  requireCondition(paths.has("src/lib.rs"), "lesson.files must include src/lib.rs for backend validation");
  requireCondition(Array.isArray(lesson.hints) && lesson.hints.length === 3, "lesson.hints must contain exactly three hints");
  lesson.hints.forEach((hint, index) => {
    const path = `lesson.hints[${index}]`;
    object(hint, path, ["level", "body"], ["solutionCode"]);
    requireCondition(hint.level === index + 1, `${path}.level must be ${index + 1}`);
    string(hint.body, `${path}.body`, true);
    if (hint.solutionCode !== undefined) string(hint.solutionCode, `${path}.solutionCode`);
  });
  string(lesson.hints[2].solutionCode, "lesson.hints[2].solutionCode", true);
  validation(lesson.validation, "lesson.validation", lesson.files);
}

function parseOrigin(value) {
  const url = new URL(value);
  requireCondition(["http:", "https:"].includes(url.protocol) && !url.username && !url.password &&
    url.pathname === "/" && !url.search && !url.hash, "origin must be an HTTP(S) origin without a path, credentials, query, or fragment");
  return url.origin;
}

function parseBackendUrl(value) {
  const url = new URL(value);
  requireCondition(["http:", "https:"].includes(url.protocol) && !url.username && !url.password &&
    !url.search && !url.hash, "backend URL must use HTTP(S) without credentials, query, or fragment");
  return `${url.origin}${url.pathname.replace(/\/+$/, "")}`;
}

function verifyLink(link) {
  const url = new URL(link);
  requireCondition(["http:", "https:"].includes(url.protocol) && !url.username && !url.password, "link must use HTTP(S) without credentials");
  requireCondition(url.hash.startsWith("#playground?"), "link must use the #playground route");
  const params = new URLSearchParams(url.hash.slice("#playground?".length));
  requireCondition([...params.keys()].length === 1 && params.has("lesson"), "link must contain exactly one lesson parameter");
  const encoded = params.get("lesson");
  requireCondition(encoded.length > 0 && encoded.length <= Math.ceil(MAX_BYTES * 4 / 3) &&
    /^[A-Za-z0-9_-]+$/.test(encoded) && encoded.length % 4 !== 1, "invalid or oversized base64url payload");
  const bytes = Buffer.from(encoded, "base64url");
  requireCondition(bytes.length <= MAX_BYTES && bytes.toString("base64url") === encoded, "invalid or oversized base64url payload");
  const lesson = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  validateLesson(lesson);
  return lesson;
}

function validationSteps(validation) {
  return validation.mode === "all" ? validation.validations : [validation];
}

function runFiles(lesson, solutionCode) {
  return lesson.files.map((file) => ({
    path: file.path,
    content: file.role === "editable" ? solutionCode : file.content,
  }));
}

function addCargoTestFiles(files, validation) {
  const seenPaths = new Set(files.map((file) => file.path));
  for (const file of validation.testFiles ?? []) {
    if (!seenPaths.has(file.path)) {
      files.push({ path: file.path, content: file.content });
      seenPaths.add(file.path);
    }
  }
  const hasTestFile = files.some((file) => file.path.startsWith("tests/") && file.path.endsWith(".rs"));
  if (!hasTestFile && typeof validation.testCode === "string" && !seenPaths.has("tests/lesson.rs")) {
    files.push({ path: "tests/lesson.rs", content: validation.testCode });
  }
  return files;
}

function backendRunRequests(lesson, solutionCode) {
  const steps = validationSteps(lesson.validation);
  const backendSteps = steps.filter((step) =>
    step.mode === "backend-cargo-test" || step.mode === "backend-compile-fail");
  if (backendSteps.length === 0) {
    return [{
      mode: "cargo-test",
      dependencySet: "std",
      files: runFiles(lesson, solutionCode),
    }];
  }
  return backendSteps.map((step) => {
    const files = runFiles(lesson, solutionCode);
    if (step.mode === "backend-cargo-test") {
      addCargoTestFiles(files, step);
      return {
        mode: "cargo-test",
        dependencySet: step.dependencySet ?? "std",
        files,
      };
    }
    return {
      mode: "compile-fail",
      dependencySet: step.dependencySet ?? "std",
      files,
      compileFailCases: step.cases,
    };
  });
}

async function testSolution(lesson, backendUrl) {
  const solutionCode = lesson.hints[2].solutionCode;
  const requests = backendRunRequests(lesson, solutionCode);
  const hasStructuralChecks = validationSteps(lesson.validation).some((step) => step.mode === "structural");
  if (hasStructuralChecks) {
    console.error("Note: browser structural checks are not run by --test-solution.");
  }

  for (const [index, request] of requests.entries()) {
    let response;
    try {
      response = await fetch(`${backendUrl}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal: AbortSignal.timeout(65_000),
      });
    } catch (error) {
      throw new Error(`Could not reach lesson backend at ${backendUrl}/run: ${error.message}`);
    }
    const responseText = await response.text();
    let outcome;
    try {
      outcome = JSON.parse(responseText);
    } catch {
      throw new Error(`Lesson backend returned invalid JSON (HTTP ${response.status}).`);
    }
    if (!response.ok) {
      throw new Error(`Lesson backend rejected the solution (HTTP ${response.status}): ${responseText.slice(0, 2000)}`);
    }
    requireCondition(outcome !== null && typeof outcome === "object" &&
      ["passed", "failed", "compile_error", "timed_out"].includes(outcome.status) &&
      typeof outcome.stdout === "string" && typeof outcome.stderr === "string" &&
      typeof outcome.duration_ms === "number" && Number.isFinite(outcome.duration_ms),
    "lesson backend returned an invalid run result");
    if (outcome.status !== "passed") {
      const details = [outcome.stderr, outcome.stdout].filter(Boolean).join("\n");
      throw new Error(`Solution check ${index + 1} ${outcome.status}${details ? `:\n${details}` : "."}`);
    }
  }
  console.error(`Solution passed ${requests.length} backend check${requests.length === 1 ? "" : "s"}.`);
}

async function main(args) {
  const [command, input, ...options] = args;
  requireCondition((command === "generate" || command === "verify") && input, "usage: node link.mjs generate <lesson.json|-> [--origin <origin>] [--test-solution] [--backend-url <url>] | verify <url|->");
  if (command === "verify") {
    requireCondition(options.length === 0, "verify does not accept additional arguments");
    const link = input === "-" ? readFileSync(0, "utf8").trim() : input;
    verifyLink(link);
    console.log("Valid Playground link.");
    return;
  }
  let origin = DEFAULT_ORIGIN;
  let backendUrl;
  let shouldTestSolution = false;
  for (let index = 0; index < options.length; index++) {
    if (options[index] === "--origin" && options[index + 1]) {
      origin = parseOrigin(options[++index]);
    } else if (options[index] === "--backend-url" && options[index + 1]) {
      backendUrl = parseBackendUrl(options[++index]);
    } else if (options[index] === "--test-solution" && !shouldTestSolution) {
      shouldTestSolution = true;
    } else {
      throw new Error("expected [--origin <origin>] [--test-solution] [--backend-url <url>]");
    }
  }
  requireCondition(!backendUrl || shouldTestSolution, "--backend-url requires --test-solution");
  const lesson = JSON.parse(readFileSync(input === "-" ? 0 : input, "utf8"));
  validateLesson(lesson);
  if (shouldTestSolution) await testSolution(lesson, backendUrl ?? origin);
  const json = JSON.stringify(lesson);
  const bytes = Buffer.from(json, "utf8");
  requireCondition(bytes.length <= MAX_BYTES, `lesson is ${bytes.length} bytes; maximum is ${MAX_BYTES}`);
  const link = `${origin}/#playground?lesson=${bytes.toString("base64url")}`;
  requireCondition(JSON.stringify(verifyLink(link)) === json, "link failed its round-trip verification");
  console.log(link);
}

main(process.argv.slice(2)).catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
```
<!-- link-tool:end -->

## Procedure

1. Use the self-contained payload contract above. Do not require or assume
   repository files are available.
2. Honor the requested concept and level. If a simple lesson is requested without
   a concept, default to beginner-level `Option` and missing values; if the level
   is unspecified, default to `easy`. Ask only when the request cannot reasonably
   be resolved with these defaults. Choose a focused production-shaped task that
   can be completed in 5-10 minutes.
3. Author one complete public lesson object that satisfies the contract.
   Include exactly one editable file, only necessary read-only context or test
   files, and one to three progressive hints. Use a meaningful `conceptId`;
   the app may display it directly when no concept metadata is available.
4. Save the complete payload as a UTF-8 JSON file in a temporary location,
   using a JSON serializer rather than constructing JSON or a link by hand.
   Extract the embedded verifier from this skill to a temporary `.mjs` file,
   generate a link, and verify that exact link:

   ```sh
   skill_dir=/path/to/playground-lesson
   tool=$(mktemp --suffix=.mjs)
   trap 'rm -f "$tool"' EXIT
   node - "$skill_dir/SKILL.md" "$tool" <<'NODE'
   const fs = require("node:fs");
   const [skillPath, toolPath] = process.argv.slice(2);
   const text = fs.readFileSync(skillPath, "utf8");
   const start = text.indexOf("<!-- link-tool:start -->");
   const end = text.indexOf("<!-- link-tool:end -->", start);
   const block = text.slice(start, end).match(/```js\n([\s\S]*?)\n```/);
   if (start < 0 || end < 0 || !block) throw new Error("Embedded link tool not found");
   fs.writeFileSync(toolPath, block[1] + "\n");
   NODE
   link=$(node "$tool" generate /path/to/lesson.json)
   node "$tool" verify "$link"
   printf '%s\n' "$link"
   ```

   To test the complete intended solution from hint 3 before emitting the link,
   add `--test-solution`:

   ```sh
   link=$(node "$tool" generate /path/to/lesson.json --test-solution)
   ```

   Replace the paths with the actual skill and payload paths. The script
   validates the public payload, serializes it compactly, enforces the 32 KiB
   UTF-8 limit, generates an unpadded base64url link, and verifies a round trip
   before printing the complete link to stdout. Errors go to stderr and result
   in a nonzero exit; correct the payload and rerun. Do not truncate or edit
   the generated link. The default origin is `https://borrowquest.site`; use
   `--origin https://example.com` only when the user explicitly supplies an
   origin.
   `--test-solution` runs the complete intended source from hint 3 against the
   lesson's backend validation before emitting a link. The backend URL defaults
   to the link origin (the normal same-origin deployment setup); pass
   `--backend-url http://127.0.0.1:8080` for a local backend or when the API is
   hosted separately. Only backend checks are submitted; browser structural
   checks are reported as skipped. If the lesson has no backend mode, the
   script follows the default compile-smoke behavior, which proves compilation
   but not lesson behavior.
5. Verification checks the route, encoding, size, JSON, and payload contract;
   it does not compile Rust, run tests, or guarantee the deployed site is
   reachable. Never return a link if generation or verification fails. Remove
   temporary payload files when finished.
6. Return the verified share link and a concise lesson summary. Include the raw JSON
   only when requested. Remind the user that lesson source and tests are
   embedded in the link and must not contain secrets or private material.

## Constraints

- Produce the payload and link only; do not create or modify curriculum
   content.
- When revising an existing lesson payload, preserve its `id` unless the user
   requests a change. Playground draft isolation is based on the complete
   payload, not the lesson ID.
- Remind users that link recipients can inspect and alter the payload and
   tests; do not describe them as private or tamper-resistant.
- If a valid link cannot fit the payload limit or required lesson details are
  unavailable, explain the blocker instead of returning a broken link.