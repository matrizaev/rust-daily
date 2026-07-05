import type { LessonHint } from "../types/lesson";

type HintPanelProps = {
  hints: LessonHint[];
  revealedCount: number;
};

function HintPanel({ hints, revealedCount }: HintPanelProps) {
  const visibleHints = hints.slice(0, revealedCount);

  return (
    <section className="hint-panel" aria-labelledby="hint-title">
      <div className="hint-heading">
        <h2 id="hint-title">Hints</h2>
        <span>
          {revealedCount} / {hints.length}
        </span>
      </div>

      {visibleHints.length > 0 ? (
        <ol aria-live="polite">
          {visibleHints.map((hint) => (
            <li key={hint.level}>
              <p>{hint.body}</p>
              {hint.solutionCode ? (
                <pre className="hint-solution">
                  <code>{hint.solutionCode}</code>
                </pre>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="empty-hint">Reveal hints only when you need a nudge.</p>
      )}
    </section>
  );
}

export default HintPanel;
