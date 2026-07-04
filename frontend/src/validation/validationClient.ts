import { BACKEND_URL } from "../config/backend";
import type { ValidationRequest, ValidationResult } from "../types/validation";
import { runBackendValidation } from "./backendValidation";

const DEFAULT_TIMEOUT_MS = 10000;

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

export const runValidation = (request: ValidationRequest) => {
  if (request.validation.mode !== "backend-cargo-test") {
    return runWorkerValidation(request);
  }

  return runBackendValidation(request, BACKEND_URL);
};
