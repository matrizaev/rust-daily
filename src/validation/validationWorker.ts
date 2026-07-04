import type {
  ValidationFailure,
  ValidationRequest,
  ValidationResult,
  ValidationStatus,
} from "../types/validation";
import { runStructuralChecks } from "./structuralChecks";

const SOURCE_LIMIT_BYTES = 256 * 1024;
const DIAGNOSTICS_LIMIT = 4096;
const SUMMARY_LIMIT = 240;
const FAILURE_LIMIT = 20;

type WorkerScope = {
  onmessage: ((event: MessageEvent<ValidationRequest>) => void) | null;
  postMessage: (message: ValidationResult) => void;
};

const workerScope = self as unknown as WorkerScope;

const durationSince = (startedAt: number) =>
  Math.max(0, Math.round(performance.now() - startedAt));

const byteLength = (source: string) => new TextEncoder().encode(source).length;

const truncateText = (value: string, maxLength: number) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;

const limitFailures = (failures: ValidationFailure[]) =>
  failures.slice(0, FAILURE_LIMIT);

const result = (
  status: ValidationStatus,
  startedAt: number,
  summary: string,
  failures: ValidationFailure[] = [],
  diagnostics = "",
): ValidationResult => ({
  status,
  durationMs: durationSince(startedAt),
  summary: truncateText(summary, SUMMARY_LIMIT),
  diagnostics: truncateText(diagnostics, DIAGNOSTICS_LIMIT),
  failures: limitFailures(failures),
});

const sourceTooLargeResult = (startedAt: number) =>
  result(
    "failed",
    startedAt,
    "This file is too large to check in the browser.",
    [
      {
        name: "src/lib.rs",
        message: "The editable Rust file must stay under 256 KB.",
      },
    ],
  );

const unsupportedResult = (startedAt: number) =>
  result(
    "unsupported",
    startedAt,
    "This lesson cannot be checked in the browser yet.",
  );

const selfCheckResult = (startedAt: number) =>
  result(
    "self_check",
    startedAt,
    "Self-check recorded. No compiler or hidden tests ran in this browser.",
  );

const structuralResult = (
  request: ValidationRequest,
  startedAt: number,
): ValidationResult => {
  const source = request.files["src/lib.rs"];

  if (byteLength(source) > SOURCE_LIMIT_BYTES) {
    return sourceTooLargeResult(startedAt);
  }

  if (request.validation.mode !== "structural") {
    return unsupportedResult(startedAt);
  }

  const failures = runStructuralChecks(source, request.validation.checks);

  return failures.length === 0
    ? result("passed", startedAt, "All checks passed.")
    : result("failed", startedAt, "Some checks need attention.", failures);
};

const handleRequest = (
  request: ValidationRequest,
  startedAt: number,
): ValidationResult => {
  if (request.validation.mode === "structural") {
    return structuralResult(request, startedAt);
  }

  if (request.validation.mode === "self-check") {
    return selfCheckResult(startedAt);
  }

  return unsupportedResult(startedAt);
};

workerScope.onmessage = (event: MessageEvent<ValidationRequest>) => {
  const startedAt = performance.now();

  try {
    workerScope.postMessage(handleRequest(event.data, startedAt));
  } catch {
    workerScope.postMessage(
      result("internal_error", startedAt, "The app failed to run validation."),
    );
  }
};

export {};
