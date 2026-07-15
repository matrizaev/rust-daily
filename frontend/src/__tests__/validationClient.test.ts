import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  LessonValidationStep,
  ValidationRequest,
  ValidationResult,
  ValidationStatus,
} from "../types/validation";
import { runBackendValidation } from "../validation/backendValidation";
import { runValidation } from "../validation/validationClient";

vi.mock("../validation/backendValidation", () => ({
  runBackendValidation: vi.fn(),
}));

const backendValidationMock = vi.mocked(runBackendValidation);

const validationResult = (
  status: ValidationStatus,
  summary = "ok",
): ValidationResult => ({
  status,
  summary,
  diagnostics: "",
  durationMs: 1,
  failures:
    status === "failed"
      ? [{ name: "local check", message: "Local check failed." }]
      : [],
});

const structuralStep: LessonValidationStep = {
  mode: "structural",
  timeoutMs: 1000,
  checks: [],
};

const backendStep: LessonValidationStep = {
  mode: "backend-cargo-test",
  timeoutMs: 1,
  dependencySet: "std",
};

const validationRequest = (
  validations: LessonValidationStep[],
): ValidationRequest => ({
  lessonId: "lesson-1",
  editablePath: "src/lib.rs",
  files: {
    "src/lib.rs": "pub fn answer() -> u8 { 42 }\n",
  },
  validation: {
    mode: "all",
    validations,
  },
});

let workerResults: ValidationResult[] = [];
let workerRequests: ValidationRequest[] = [];
let events: string[] = [];

class MockWorker {
  onmessage: ((event: MessageEvent<ValidationResult>) => void) | null = null;
  onerror: (() => void) | null = null;

  postMessage(request: ValidationRequest) {
    workerRequests.push(request);
    events.push(`local:${request.validation.mode}`);
    const result = workerResults.shift() ?? validationResult("passed");

    queueMicrotask(() => {
      events.push(`local-finished:${request.validation.mode}`);
      this.onmessage?.({ data: result } as MessageEvent<ValidationResult>);
    });
  }

  terminate() {}
}

const installWorkerMock = () => {
  vi.stubGlobal("Worker", MockWorker);
};

afterEach(() => {
  workerResults = [];
  workerRequests = [];
  events = [];
  backendValidationMock.mockReset();
  vi.unstubAllGlobals();
});

describe("runValidation", () => {
  it("does not call the backend when local browser checks fail", async () => {
    installWorkerMock();
    workerResults = [validationResult("failed", "Local checks failed.")];
    backendValidationMock.mockResolvedValue(validationResult("passed", "Backend passed."));

    const result = await runValidation(
      validationRequest([backendStep, structuralStep]),
    );

    expect(result.status).toBe("failed");
    expect(workerRequests.map((request) => request.validation.mode)).toEqual([
      "structural",
    ]);
    expect(backendValidationMock).not.toHaveBeenCalled();
  });

  it("runs local browser checks before backend validation", async () => {
    installWorkerMock();
    workerResults = [validationResult("passed", "Local checks passed.")];
    backendValidationMock.mockImplementation(async () => {
      events.push("backend");
      return validationResult("passed", "Backend passed.");
    });

    const result = await runValidation(
      validationRequest([backendStep, structuralStep]),
    );

    expect(result.status).toBe("passed");
    expect(events).toEqual([
      "local:structural",
      "local-finished:structural",
      "backend",
    ]);
    expect(backendValidationMock).toHaveBeenCalledOnce();
  });
});
