import { CheckCircle2, Lightbulb, RotateCcw } from "lucide-react";
import type { ValidationStatus } from "../types/validation";

type LessonActionsProps = {
  canRevealHint: boolean;
  canCheck: boolean;
  checkStatus: ValidationStatus | null;
  isChecking: boolean;
  onCheck: () => void;
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
  onCheck,
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
    </div>
  );
}

export default LessonActions;
