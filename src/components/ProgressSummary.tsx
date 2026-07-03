import { BookCheck, Flame, Layers3 } from "lucide-react";
import type { ReactNode } from "react";
import type { ProgressSummary as ProgressSummaryData } from "../progress/progressSelectors";

type ProgressSummaryProps = {
  summary: ProgressSummaryData;
};

type SummaryItemProps = {
  icon: ReactNode;
  label: string;
  value: number;
};

const plural = (count: number, singular: string, pluralName: string) =>
  count === 1 ? singular : pluralName;

const SummaryItem = ({ icon, label, value }: SummaryItemProps) => (
  <div className="progress-summary-item">
    {icon}
    <strong>{value}</strong>
    <span>{label}</span>
  </div>
);

function ProgressSummary({ summary }: ProgressSummaryProps) {
  const completedLabel = plural(
    summary.completedLessons,
    "lesson completed",
    "lessons completed",
  );
  const introducedLabel = plural(
    summary.conceptsIntroduced,
    "concept introduced",
    "concepts introduced",
  );

  return (
    <section className="progress-summary" aria-label="Local progress">
      <SummaryItem
        icon={<Flame size={19} aria-hidden="true" />}
        label={`${plural(summary.currentStreak, "day", "day")} streak`}
        value={summary.currentStreak}
      />
      <SummaryItem
        icon={<BookCheck size={19} aria-hidden="true" />}
        label={completedLabel}
        value={summary.completedLessons}
      />
      <SummaryItem
        icon={<Layers3 size={19} aria-hidden="true" />}
        label={introducedLabel}
        value={summary.conceptsIntroduced}
      />
    </section>
  );
}

export default ProgressSummary;
