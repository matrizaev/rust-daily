import { useCallback, useEffect, useRef, useState } from "react";
import type {
  ValidationPanelState,
} from "../ValidationPanel";
import type { Lesson } from "../../types/lesson";
import type { LessonValidation, ValidationResult } from "../../types/validation";
import { runValidation } from "../../validation/validationClient";

const idleValidationState: ValidationPanelState = {
  kind: "idle",
};

const runningValidationState: ValidationPanelState = {
  kind: "running",
};

const resultState = (
  result: ValidationResult,
  stale: boolean,
): ValidationPanelState => ({
  kind: "result",
  result,
  stale,
});

const unsupportedResult = (): ValidationResult => ({
  status: "unsupported",
  durationMs: 0,
  summary: "This lesson cannot be checked in the browser yet.",
  diagnostics: "",
  failures: [],
});

const shouldCompleteLesson = (result: ValidationResult) =>
  result.status === "passed" || result.status === "self_check";

const buildValidationRequest = (
  lesson: Lesson,
  validation: LessonValidation,
  code: string,
  filePath: string,
) => ({
  lessonId: lesson.id,
  validation,
  editablePath: filePath,
  files: Object.fromEntries(
    lesson.files.map((file) => [
      file.path,
      file.path === filePath ? code : file.content,
    ]),
  ),
});

const shouldMarkStale = (
  state: ValidationPanelState,
  checkedCode: string | null,
  code: string,
) => {
  return (
    state.kind === "result" &&
    !state.stale &&
    checkedCode !== null &&
    checkedCode !== code
  );
};

const staleStateForCodeChange = (
  state: ValidationPanelState,
  checkedCode: string | null,
  code: string,
) => {
  return shouldMarkStale(state, checkedCode, code) && state.kind === "result"
    ? resultState(state.result, true)
    : state;
};

type UseLessonValidationOptions = {
  code: string;
  filePath: string;
  lesson: Lesson;
  onPassedValidation: () => void;
  onValidationAttempt: () => void;
};

export const useLessonValidation = ({
  code,
  filePath,
  lesson,
  onPassedValidation,
  onValidationAttempt,
}: UseLessonValidationOptions) => {
  const [state, setState] = useState<ValidationPanelState>(idleValidationState);
  const [checkedCode, setCheckedCode] = useState<string | null>(null);
  const codeRef = useRef(code);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    setState(idleValidationState);
    setCheckedCode(null);
  }, [lesson.id]);

  useEffect(() => {
    setState((current) =>
      staleStateForCodeChange(current, checkedCode, code),
    );
  }, [checkedCode, code]);

  const handleCheck = useCallback(async () => {
    const { validation } = lesson;
    const requestCode = codeRef.current;

    onValidationAttempt();

    if (!validation) {
      setState(resultState(unsupportedResult(), false));
      setCheckedCode(requestCode);
      return;
    }

    setState(runningValidationState);

    const result = await runValidation(
      buildValidationRequest(lesson, validation, requestCode, filePath),
    );

    setCheckedCode(requestCode);
    setState(resultState(result, codeRef.current !== requestCode));

    if (shouldCompleteLesson(result)) {
      onPassedValidation();
    }
  }, [filePath, lesson, onPassedValidation, onValidationAttempt]);

  return {
    canCheck: Boolean(lesson.validation),
    handleCheck,
    isChecking: state.kind === "running",
    state,
  };
};
