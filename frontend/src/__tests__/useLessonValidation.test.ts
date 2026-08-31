import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Lesson } from "../types/lesson";
import type { ValidationResult } from "../types/validation";
import { runValidation } from "../validation/validationClient";
import { useLessonValidation } from "../components/lesson/useLessonValidation";

vi.mock("../validation/validationClient", () => ({
  runValidation: vi.fn(),
}));

const runValidationMock = vi.mocked(runValidation);

const passingResult: ValidationResult = {
  status: "passed",
  durationMs: 1,
  summary: "All checks passed.",
  diagnostics: "",
  failures: [],
};

const lesson = (id: string): Lesson => ({
  schemaVersion: 2,
  id,
  arcId: "test-arc",
  arcTitle: "Test arc",
  order: 1,
  day: 1,
  arcLength: 1,
  title: "Test lesson",
  conceptId: "test-concept",
  difficulty: "easy",
  estimatedMinutes: 5,
  scenario: "Test scenario",
  instructions: "Implement the test.",
  starterCode: "pub fn answer() -> u8 { 0 }\n",
  files: [
    {
      path: "src/lib.rs",
      role: "editable",
      content: "pub fn answer() -> u8 { 0 }\n",
    },
  ],
  hints: [],
  completionExplanation: "Complete.",
  validation: {
    mode: "backend-cargo-test",
    timeoutMs: 1000,
    dependencySet: "std",
  },
});

afterEach(() => {
  runValidationMock.mockReset();
});

describe("useLessonValidation", () => {
  it("cancels and ignores a validation result after the lesson changes", async () => {
    let resolveValidation: (result: ValidationResult) => void = () => {};
    let capturedSignal: AbortSignal | undefined;
    runValidationMock.mockImplementation((_request, signal) => {
      capturedSignal = signal;

      return new Promise((resolve) => {
        resolveValidation = resolve;
      });
    });
    const onPassedValidation = vi.fn();
    const onValidationAttempt = vi.fn();
    const { result, rerender } = renderHook(
      ({ currentLesson }) =>
        useLessonValidation({
          code: currentLesson.starterCode,
          filePath: "src/lib.rs",
          lesson: currentLesson,
          onPassedValidation,
          onValidationAttempt,
        }),
      {
        initialProps: {
          currentLesson: lesson("lesson-a"),
        },
      },
    );

    let pendingValidation: Promise<void> = Promise.resolve();
    act(() => {
      pendingValidation = result.current.handleCheck();
    });

    expect(result.current.isChecking).toBe(true);
    rerender({ currentLesson: lesson("lesson-b") });
    expect(capturedSignal?.aborted).toBe(true);

    await act(async () => {
      resolveValidation(passingResult);
      await pendingValidation;
    });

    expect(result.current.state).toEqual({ kind: "idle" });
    expect(onValidationAttempt).toHaveBeenCalledOnce();
    expect(onPassedValidation).not.toHaveBeenCalled();
  });
});
