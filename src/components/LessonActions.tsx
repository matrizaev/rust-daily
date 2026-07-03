import { CheckCircle2, Lightbulb, RotateCcw } from "lucide-react";

type LessonActionsProps = {
  canRevealHint: boolean;
  canCheck: boolean;
  isChecking: boolean;
  onCheck: () => void;
  onReset: () => void;
  onRevealHint: () => void;
};

const getCheckLabel = (canCheck: boolean, isChecking: boolean) => {
  if (isChecking) {
    return "Checking...";
  }

  return canCheck ? "Check" : "Check unavailable";
};

function LessonActions({
  canCheck,
  canRevealHint,
  isChecking,
  onCheck,
  onReset,
  onRevealHint,
}: LessonActionsProps) {
  const checkLabel = getCheckLabel(canCheck, isChecking);

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
        className="check-button"
        type="button"
        onClick={onCheck}
        disabled={!canCheck || isChecking}
        aria-busy={isChecking}
      >
        <CheckCircle2 size={19} aria-hidden="true" />
        {checkLabel}
      </button>
    </div>
  );
}

export default LessonActions;
