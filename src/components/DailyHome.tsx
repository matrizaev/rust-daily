import { ArrowRight, CalendarDays, Clock, Gauge, Layers } from "lucide-react";
import type { ReactNode } from "react";
import type { Concept, Lesson } from "../types/lesson";

type DailyHomeProps = {
  lesson: Lesson;
  concept: Concept | null;
  onContinue: () => void;
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

const LessonFacts = ({ lesson, concept }: Omit<DailyHomeProps, "onContinue">) => (
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

function DailyHome(props: DailyHomeProps) {
  const { lesson, concept, onContinue } = props;

  return (
    <main className="app-shell daily-shell">
      <section className="daily-overview" aria-labelledby="daily-title">
        <BrandRow />
        <DailyHeading lesson={lesson} />
        <LessonFacts concept={concept} lesson={lesson} />

        <button className="primary-button" type="button" onClick={onContinue}>
          Continue
          <ArrowRight size={20} aria-hidden="true" />
        </button>
      </section>
    </main>
  );
}

export default DailyHome;
