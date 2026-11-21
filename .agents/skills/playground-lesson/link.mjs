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
  requireCondition(Array.isArray(lesson.hints) && lesson.hints.length >= 1 && lesson.hints.length <= 3, "lesson.hints must contain one to three hints");
  lesson.hints.forEach((hint, index) => {
    const path = `lesson.hints[${index}]`;
    object(hint, path, ["level", "body"], ["solutionCode"]);
    requireCondition(hint.level === index + 1, `${path}.level must be ${index + 1}`);
    string(hint.body, `${path}.body`, true);
    if (hint.solutionCode !== undefined) string(hint.solutionCode, `${path}.solutionCode`);
  });
  validation(lesson.validation, "lesson.validation", lesson.files);
}

function parseOrigin(value) {
  const url = new URL(value);
  requireCondition(["http:", "https:"].includes(url.protocol) && !url.username && !url.password &&
    url.pathname === "/" && !url.search && !url.hash, "origin must be an HTTP(S) origin without a path, credentials, query, or fragment");
  return url.origin;
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

function main(args) {
  const [command, input, ...options] = args;
  requireCondition((command === "generate" || command === "verify") && input, "usage: node link.mjs generate <lesson.json|-> [--origin <origin>] | verify <url|->");
  if (command === "verify") {
    requireCondition(options.length === 0, "verify does not accept additional arguments");
    const link = input === "-" ? readFileSync(0, "utf8").trim() : input;
    verifyLink(link);
    console.log("Valid Playground link.");
    return;
  }
  requireCondition(options.length === 0 || (options.length === 2 && options[0] === "--origin"), "expected --origin <origin>");
  const origin = parseOrigin(options.length ? options[1] : DEFAULT_ORIGIN);
  const lesson = JSON.parse(readFileSync(input === "-" ? 0 : input, "utf8"));
  validateLesson(lesson);
  const json = JSON.stringify(lesson);
  const bytes = Buffer.from(json, "utf8");
  requireCondition(bytes.length <= MAX_BYTES, `lesson is ${bytes.length} bytes; maximum is ${MAX_BYTES}`);
  const link = `${origin}/#playground?lesson=${bytes.toString("base64url")}`;
  requireCondition(JSON.stringify(verifyLink(link)) === json, "link failed its round-trip verification");
  console.log(link);
}

try {
  main(process.argv.slice(2));
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
}
