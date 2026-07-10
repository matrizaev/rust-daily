import { BACKEND_URL } from "../config/backend";
import type {
  LessonValidationStep,
  ValidationFailure,
  ValidationRequest,
  ValidationResult,
  ValidationStatus,
} from "../types/validation";
import { runBackendValidation } from "./backendValidation";

const DEFAULT_TIMEOUT_MS = 10000;
const DIAGNOSTICS_LIMIT = 4096;
const SUMMARY_LIMIT = 240;
const FAILURE_LIMIT = 20;
const DEFAULT_BACKEND_TEST_CODE =
  "use rust_daily_lesson as _;\n\n#[test]\nfn code_compiles() {}\n";

type StepResult = {
  label: string;
  result: ValidationResult;
};

const STATUS_PRIORITY: Record<ValidationStatus, number> = {
  passed: 0,
  self_check: 1,
  unsupported: 2,
  timeout: 3,
  failed: 4,
  compile_error: 5,
  internal_error: 6,
};

const getTimeoutMs = (request: ValidationRequest) =>
  "timeoutMs" in request.validation
    ? request.validation.timeoutMs
    : DEFAULT_TIMEOUT_MS;

const durationSince = (startedAt: number) =>
  Math.max(0, Math.round(performance.now() - startedAt));

const timeoutResult = (startedAt: number): ValidationResult => ({
  status: "timeout",
  durationMs: durationSince(startedAt),
  summary: "This check took too long and was stopped.",
  diagnostics: "",
  failures: [],
});

const internalErrorResult = (startedAt: number): ValidationResult => ({
  status: "internal_error",
  durationMs: durationSince(startedAt),
  summary: "The app failed to run validation.",
  diagnostics: "",
  failures: [],
});

const truncateText = (value: string, maxLength: number) =>
  value.length <= maxLength ? value : `${value.slice(0, maxLength)}...`;

const configuredValidationSteps = (request: ValidationRequest) =>
  request.validation.mode === "all"
    ? request.validation.validations
    : [request.validation];

const isBackendStep = (validation: LessonValidationStep) =>
  validation.mode === "backend-cargo-test" ||
  validation.mode === "backend-compile-fail";

const backendTimeoutMs = (validations: LessonValidationStep[]) =>
  Math.max(
    DEFAULT_TIMEOUT_MS,
    ...validations.map((validation) =>
      "timeoutMs" in validation ? validation.timeoutMs : DEFAULT_TIMEOUT_MS,
    ),
  );

const defaultBackendStep = (
  validations: LessonValidationStep[],
): LessonValidationStep => ({
  mode: "backend-cargo-test",
  timeoutMs: backendTimeoutMs(validations),
  testCode: DEFAULT_BACKEND_TEST_CODE,
  dependencySet: "std",
});

const validationSteps = (request: ValidationRequest) => {
  const validations = configuredValidationSteps(request);

  return validations.some(isBackendStep)
    ? validations
    : [...validations, defaultBackendStep(validations)];
};

const stepRequest = (
  request: ValidationRequest,
  validation: LessonValidationStep,
): ValidationRequest => ({
  ...request,
  validation,
});

const stepLabel = (validation: LessonValidationStep) =>
  validation.mode === "backend-compile-fail"
    ? "Compile-fail checks"
    : isBackendStep(validation)
      ? "Rust runner"
      : "Browser checks";

const createWorker = () =>
  new Worker(new URL("./validationWorker.ts", import.meta.url), {
    type: "module",
  });

const runWorkerValidation = (request: ValidationRequest) =>
  new Promise<ValidationResult>((resolve) => {
    const startedAt = performance.now();
    let worker: Worker;

    try {
      worker = createWorker();
    } catch {
      resolve(internalErrorResult(startedAt));
      return;
    }

    const timer = window.setTimeout(() => {
      worker.terminate();
      resolve(timeoutResult(startedAt));
    }, getTimeoutMs(request));

    worker.onmessage = (event: MessageEvent<ValidationResult>) => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve(event.data);
    };

    worker.onerror = () => {
      window.clearTimeout(timer);
      worker.terminate();
      resolve(internalErrorResult(startedAt));
    };

    worker.postMessage(request);
  });

const runValidationStep = async (
  request: ValidationRequest,
  validation: LessonValidationStep,
): Promise<StepResult> => {
  const requestForStep = stepRequest(request, validation);
  const result =
    isBackendStep(validation)
      ? await runBackendValidation(requestForStep, BACKEND_URL)
      : await runWorkerValidation(requestForStep);

  return {
    label: stepLabel(validation),
    result,
  };
};

const uniqueFailures = (failures: ValidationFailure[]) => {
  const seen = new Set<string>();

  return failures.filter((failure) => {
    const key = `${failure.name}\n${failure.message}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const prefixedFailures = (results: StepResult[]) =>
  uniqueFailures(
    results.flatMap(({ label, result }) =>
      result.failures.map((failure) => ({
        name: `${label}: ${failure.name}`,
        message: failure.message,
      })),
    ),
  ).slice(0, FAILURE_LIMIT);

const diagnosticsFromResults = (results: StepResult[]) =>
  results
    .map(({ label, result }) =>
      result.diagnostics ? `${label}:\n${result.diagnostics}` : "",
    )
    .filter(Boolean)
    .join("\n\n");

const aggregateStatus = (statuses: ValidationStatus[]): ValidationStatus =>
  statuses.reduce(
    (selected, status) =>
      STATUS_PRIORITY[status] > STATUS_PRIORITY[selected] ? status : selected,
    "passed",
  );

const aggregateSummary = (status: ValidationStatus) => {
  const summaries: Record<ValidationStatus, string> = {
    passed: "All checks passed.",
    self_check: "Self-check recorded.",
    failed: "Some checks need attention.",
    compile_error: "The Rust code did not compile.",
    timeout: "A required check timed out.",
    unsupported: "A required check is unavailable.",
    internal_error: "A required check failed internally.",
  };

  return summaries[status];
};

const aggregateResults = (results: StepResult[]): ValidationResult => {
  if (results.length === 1) {
    return results[0].result;
  }

  const status = aggregateStatus(
    results.map(({ result }) => result.status),
  );

  return {
    status,
    durationMs: results.reduce(
      (total, { result }) => total + result.durationMs,
      0,
    ),
    summary: truncateText(aggregateSummary(status), SUMMARY_LIMIT),
    diagnostics: truncateText(diagnosticsFromResults(results), DIAGNOSTICS_LIMIT),
    failures: prefixedFailures(results),
  };
};

export const runValidation = async (request: ValidationRequest) => {
  const results = await Promise.all(
    validationSteps(request).map((validation) =>
      runValidationStep(request, validation),
    ),
  );

  return aggregateResults(results);
};
