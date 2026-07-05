import {
  ArrowRight,
  BookOpen,
  Clock,
  Gauge,
  Layers,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ProgressSummary as ProgressSummaryData } from "../progress/progressSelectors";
import type { Concept, Lesson } from "../types/lesson";
import type { ProgressStore } from "../types/progress";
import CurriculumPath from "./CurriculumPath";
import ProgressSummary from "./ProgressSummary";

type DailyHomeProps = {
  lesson: Lesson;
  lessons: Lesson[];
  concept: Concept | null;
  onContinue: () => void;
  onOpenSettings: () => void;
  progress: ProgressStore;
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
        Arc step {lesson.day} of {lesson.arcLength}
      </span>
    </LessonFact>

    <LessonFact icon={<Clock size={18} aria-hidden="true" />} label="Time">
      {lesson.estimatedMinutes} minutes
    </LessonFact>

    <LessonFact
      icon={<BookOpen size={18} aria-hidden="true" />}
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
    <p className="eyebrow">Next lesson</p>
    <h1 id="daily-title">{lesson.title}</h1>
    <p>{lesson.scenario}</p>
  </div>
);

const HomeActions = ({
  onContinue,
  onOpenSettings,
}: Pick<DailyHomeProps, "onContinue" | "onOpenSettings">) => (
  <div className="home-actions">
    <button className="primary-button" type="button" onClick={onContinue}>
      Continue
      <ArrowRight size={20} aria-hidden="true" />
    </button>

    <button
      className="secondary-button"
      type="button"
      onClick={onOpenSettings}
    >
      <Settings size={19} aria-hidden="true" />
      Settings
    </button>
  </div>
);

function DailyHome(props: DailyHomeProps) {
  const {
    lesson,
    lessons,
    concept,
    onContinue,
    onOpenSettings,
    progress,
    summary,
  } = props;

  return (
    <main className="app-shell daily-shell">
      <section className="daily-overview" aria-labelledby="daily-title">
        <BrandRow />
        <ProgressSummary summary={summary} />
        <DailyHeading lesson={lesson} />
        <LessonFacts concept={concept} lesson={lesson} />

        <HomeActions
          onContinue={onContinue}
          onOpenSettings={onOpenSettings}
        />

        <CurriculumPath
          activeLessonId={lesson.id}
          lessons={lessons}
          progress={progress}
        />
      </section>
    </main>
  );
}

export default DailyHome;
