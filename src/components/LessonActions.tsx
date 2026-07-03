import { CheckCircle2, Lightbulb, RotateCcw } from "lucide-react";

type LessonActionsProps = {
  canRevealHint: boolean;
  onReset: () => void;
  onRevealHint: () => void;
};

function LessonActions({
  canRevealHint,
  onReset,
  onRevealHint,
}: LessonActionsProps) {
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

      <button className="check-button" type="button" disabled>
        <CheckCircle2 size={19} aria-hidden="true" />
        Validation arrives in Milestone 2
      </button>
    </div>
  );
}

export default LessonActions;
