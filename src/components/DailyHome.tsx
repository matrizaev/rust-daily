import { ArrowRight, CalendarDays, Clock, Gauge, Layers } from "lucide-react";
import type { ReactNode } from "react";
import type { ProgressSummary as ProgressSummaryData } from "../progress/progressSelectors";
import type { Concept, Lesson } from "../types/lesson";
import ProgressSummary from "./ProgressSummary";

type DailyHomeProps = {
  lesson: Lesson;
  concept: Concept | null;
  onContinue: () => void;
  onResetProgress: () => void;
  summary: ProgressSummaryData;
};

type LessonFactProps = {
  icon: ReactNode;
  label: string;
  valueClassName?: string;
  children: ReactNode;
};

const LessonFact = ({
  icon,
  label,
  valueClassName,
  children,
}: LessonFactProps) => (
  <div>
    <dt>
      {icon}
      {label}
    </dt>
    <dd className={valueClassName}>{children}</dd>
  </div>
);

const BrandRow = () => (
  <div className="brand-row">
    <span className="brand-mark" aria-hidden="true">
      RD
    </span>
    <span className="brand-name">Rust Daily</span>
  </div>
);

type LessonFactsProps = Pick<DailyHomeProps, "concept" | "lesson">;

const LessonFacts = ({ lesson, concept }: LessonFactsProps) => (
  <dl className="lesson-facts" aria-label="Lesson details">
    <LessonFact icon={<Layers size={18} aria-hidden="true" />} label="Arc">
      {lesson.arcTitle}
      <span>
        Day {lesson.day} of {lesson.arcLength}
      </span>
    </LessonFact>

    <LessonFact icon={<Clock size={18} aria-hidden="true" />} label="Time">
      {lesson.estimatedMinutes} minutes
    </LessonFact>

    <LessonFact
      icon={<CalendarDays size={18} aria-hidden="true" />}
      label="Concept"
    >
      {concept?.name ?? lesson.conceptId}
    </LessonFact>

    <LessonFact
      icon={<Gauge size={18} aria-hidden="true" />}
      label="Difficulty"
      valueClassName="capitalize"
    >
      {lesson.difficulty}
    </LessonFact>
  </dl>
);

const DailyHeading = ({ lesson }: { lesson: Lesson }) => (
  <div className="daily-heading">
    <p className="eyebrow">Today&apos;s lesson</p>
    <h1 id="daily-title">{lesson.title}</h1>
    <p>{lesson.scenario}</p>
  </div>
);

const HomeActions = ({
  onContinue,
  onResetProgress,
}: Pick<DailyHomeProps, "onContinue" | "onResetProgress">) => (
  <div className="home-actions">
    <button className="primary-button" type="button" onClick={onContinue}>
      Continue
      <ArrowRight size={20} aria-hidden="true" />
    </button>

    <button
      className="text-button"
      type="button"
      onClick={onResetProgress}
    >
      Reset local progress
    </button>
  </div>
);

function DailyHome(props: DailyHomeProps) {
  const { lesson, concept, onContinue, onResetProgress, summary } = props;

  return (
    <main className="app-shell daily-shell">
      <section className="daily-overview" aria-labelledby="daily-title">
        <BrandRow />
        <ProgressSummary summary={summary} />
        <DailyHeading lesson={lesson} />
        <LessonFacts concept={concept} lesson={lesson} />

        <HomeActions
          onContinue={onContinue}
          onResetProgress={onResetProgress}
        />
      </section>
    </main>
  );
}

export default DailyHome;
