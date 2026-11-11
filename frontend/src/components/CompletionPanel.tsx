import { CheckCircle2 } from "lucide-react";
import type { Lesson } from "../types/lesson";
import type { LessonCompletion } from "../types/progress";

type CompletionPanelProps = {
  visible: boolean;
  title: string;
  status: string;
  lesson: Lesson;
  onReturnHome: () => void;
};

function CompletionPanel({
  visible,
  title,
  status,
  lesson,
  onReturnHome,
}: CompletionPanelProps) {
  if (!visible) {
    return null;
  }

  return (
    <section className="completion-panel" aria-labelledby="completion-title">
      <div className="completion-heading">
        <CheckCircle2 size={22} aria-hidden="true" />
        <div>
          <h2 id="completion-title">{title}</h2>
          <p>{status}</p>
        </div>
      </div>

      <p>{lesson.completionExplanation}</p>

      <button className="secondary-button" type="button" onClick={onReturnHome}>
        Return home
      </button>
    </section>
  );
}

export default CompletionPanel;
