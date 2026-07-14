import { writeSync } from "node:fs";

export const KNOWN_DEPENDENCY_SETS = new Set(["std", "advanced"]);

const MAX_RUNNER_PATH_BYTES = 240;
const MAX_RUNNER_PATH_COMPONENT_BYTES = 120;
const MAX_DIAGNOSTIC_SNIPPETS_PER_CASE = 16;
const MAX_DIAGNOSTIC_SNIPPET_BYTES = 512;
const MAX_DIAGNOSTIC_TOTAL_BYTES = 8192;

export const push = (errors, message) => {
  errors.push(message);
};

const validateRunnerPathByteLimit = (errors, label, path, fieldName) => {
  if (Buffer.byteLength(path) <= MAX_RUNNER_PATH_BYTES) {
    return true;
  }

  push(errors, `${label} ${fieldName} exceeds ${MAX_RUNNER_PATH_BYTES} bytes.`);
  return false;
};

const validateRunnerPathComponentLimit = (errors, label, path, fieldName) => {
  const exceedsLimit = path
    .split("/")
    .some((component) => Buffer.byteLength(component) > MAX_RUNNER_PATH_COMPONENT_BYTES);
  if (!exceedsLimit) {
    return true;
  }

  push(
    errors,
    `${label} ${fieldName} has a component exceeding ${MAX_RUNNER_PATH_COMPONENT_BYTES} bytes.`,
  );
  return false;
};

export const validateRunnerPathLimits = (errors, label, path, fieldName) => {
  const pathValid = validateRunnerPathByteLimit(errors, label, path, fieldName);
  const componentsValid = validateRunnerPathComponentLimit(errors, label, path, fieldName);
  return pathValid && componentsValid;
};

const validateDiagnosticCountLimit = (errors, label, snippets) => {
  if (snippets.length > MAX_DIAGNOSTIC_SNIPPETS_PER_CASE) {
    push(errors, `${label} has more than ${MAX_DIAGNOSTIC_SNIPPETS_PER_CASE} diagnostic snippets.`);
  }
};

const validateDiagnosticSnippetByteLimit = (errors, label, snippets) => {
  const snippetTooLarge = snippets.some(
    (snippet) => typeof snippet === "string" && Buffer.byteLength(snippet) > MAX_DIAGNOSTIC_SNIPPET_BYTES,
  );
  if (snippetTooLarge) {
    push(errors, `${label} has a diagnostic snippet exceeding ${MAX_DIAGNOSTIC_SNIPPET_BYTES} bytes.`);
  }
};

const validateDiagnosticTotalByteLimit = (errors, label, snippets) => {
  const totalBytes = snippets
    .filter((snippet) => typeof snippet === "string")
    .reduce((total, snippet) => total + Buffer.byteLength(snippet), 0);
  if (totalBytes > MAX_DIAGNOSTIC_TOTAL_BYTES) {
    push(errors, `${label} diagnostic snippets exceed ${MAX_DIAGNOSTIC_TOTAL_BYTES} bytes in total.`);
  }
};

const normalizedDiagnosticSet = (snippets) =>
  new Set(
    snippets
      .filter((snippet) => typeof snippet === "string" && snippet.trim().length > 0)
      .map((snippet) => snippet.trim()),
  );

const validateDiagnosticSetRelations = (errors, label, expected, forbidden) => {
  const normalizedExpected = normalizedDiagnosticSet(expected);
  const normalizedForbidden = normalizedDiagnosticSet(forbidden);
  if (normalizedExpected.size !== expected.length || normalizedForbidden.size !== forbidden.length) {
    push(errors, `${label} diagnostic snippets must be unique after trimming.`);
  }
  if ([...normalizedExpected].some((snippet) => normalizedForbidden.has(snippet))) {
    push(errors, `${label} cannot both expect and forbid the same diagnostic snippet.`);
  }
};

export const validateDiagnosticSnippetLimits = (errors, label, expected, forbidden) => {
  const snippets = [...expected, ...forbidden];
  validateDiagnosticCountLimit(errors, label, snippets);
  validateDiagnosticSnippetByteLimit(errors, label, snippets);
  validateDiagnosticTotalByteLimit(errors, label, snippets);
  validateDiagnosticSetRelations(errors, label, expected, forbidden);
};

export const validateDiagnosticAggregateByteLimit = (errors, label, snippets) => {
  validateDiagnosticTotalByteLimit(errors, label, snippets);
};

export const validateKnownDependencySet = (errors, lessonId, validation) => {
  const dependencySet = validation.dependencySet ?? "std";

  if (!KNOWN_DEPENDENCY_SETS.has(dependencySet)) {
    push(
      errors,
      `${lessonId} backend validation has unknown dependencySet ${String(dependencySet)}.`,
    );
  }
};

export const reportErrorsOrLog = (errors, failureSummary, successSummary) => {
  if (errors.length > 0) {
    writeSync(2, `${failureSummary} with ${errors.length} issue(s):\n`);
    errors.forEach((error) => writeSync(2, `- ${error}\n`));
    process.exitCode = 1;
    return;
  }

  console.log(successSummary);
};
