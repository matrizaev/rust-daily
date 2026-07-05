import { CheckCircle2 } from "lucide-react";
import type { Lesson } from "../types/lesson";
import type { LessonCompletion } from "../types/progress";

type CompletionPanelProps = {
  completedNow: boolean;
  completion: LessonCompletion | null;
  lesson: Lesson;
  onReturnHome: () => void;
};

const completionTitle = (completedNow: boolean) =>
  completedNow ? "Lesson complete" : "Completed";

const completionStatus = (completion: LessonCompletion | null) =>
  completion ? `Completed on ${completion.localDate}.` : "";

function CompletionPanel({
  completedNow,
  completion,
  lesson,
  onReturnHome,
}: CompletionPanelProps) {
  if (!completion) {
    return null;
  }

  return (
    <section className="completion-panel" aria-labelledby="completion-title">
      <div className="completion-heading">
        <CheckCircle2 size={22} aria-hidden="true" />
        <div>
          <h2 id="completion-title">{completionTitle(completedNow)}</h2>
          <p>{completionStatus(completion)}</p>
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
