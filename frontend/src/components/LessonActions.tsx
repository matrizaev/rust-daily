import { ArrowRight, CheckCircle2, Lightbulb, RotateCcw } from "lucide-react";
import type { ValidationStatus } from "../types/validation";

type LessonActionsProps = {
  canRevealHint: boolean;
  canCheck: boolean;
  checkStatus: ValidationStatus | null;
  isChecking: boolean;
  nextLessonId: string | null;
  onCheck: () => void;
  onOpenLesson: (lessonId: string) => void;
  onReset: () => void;
  onRevealHint: () => void;
};

type CheckTone = "neutral" | "checking" | "success" | "problem";

const checkToneByStatus: Record<ValidationStatus, CheckTone> = {
  passed: "success",
  self_check: "success",
  failed: "problem",
  compile_error: "problem",
  timeout: "problem",
  unsupported: "neutral",
  internal_error: "problem",
};

const checkStatusLabels: Partial<Record<CheckTone, string>> = {
  success: "Last check passed.",
  problem: "Last check needs changes.",
};

const getCheckLabel = (canCheck: boolean, isChecking: boolean) => {
  if (isChecking) {
    return "Checking...";
  }

  return canCheck ? "Check" : "Check unavailable";
};

const getCheckTone = (
  checkStatus: ValidationStatus | null,
  isChecking: boolean,
): CheckTone =>
  isChecking
    ? "checking"
    : checkStatus
      ? checkToneByStatus[checkStatus]
      : "neutral";

const getCheckStatusLabel = (tone: CheckTone) => checkStatusLabels[tone] ?? null;

function LessonActions({
  canCheck,
  canRevealHint,
  checkStatus,
  isChecking,
  nextLessonId,
  onCheck,
  onOpenLesson,
  onReset,
  onRevealHint,
}: LessonActionsProps) {
  const checkLabel = getCheckLabel(canCheck, isChecking);
  const checkTone = getCheckTone(checkStatus, isChecking);
  const checkStatusLabel = getCheckStatusLabel(checkTone);
  const checkClassName = `check-button check-button-${checkTone}`;

  return (
    <div className="lesson-actions" aria-label="Lesson actions">
      <button className="secondary-button" type="button" onClick={onReset}>
        <RotateCcw size={19} aria-hidden="true" />
        Reset
      </button>

      <button
        className="secondary-button"
        type="button"
        onClick={onRevealHint}
        disabled={!canRevealHint}
      >
        <Lightbulb size={19} aria-hidden="true" />
        Hint
      </button>

      <div className="lesson-check-actions">
        <button
          className={checkClassName}
          type="button"
          onClick={onCheck}
          disabled={!canCheck || isChecking}
          aria-busy={isChecking}
        >
          <CheckCircle2 size={19} aria-hidden="true" />
          {checkLabel}
          {checkStatusLabel ? (
            <span className="visually-hidden">{checkStatusLabel}</span>
          ) : null}
        </button>

        {checkTone === "success" && nextLessonId ? (
          <button
            className="next-lesson-button"
            type="button"
            onClick={() => onOpenLesson(nextLessonId)}
            aria-label="Go to next lesson"
            title="Next lesson"
          >
            <ArrowRight size={19} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default LessonActions;
