import { CheckCircle2, Circle, PlayCircle } from "lucide-react";
import type { Lesson } from "../types/lesson";
import type { ProgressStore } from "../types/progress";

type CurriculumPathProps = {
  activeLessonId: string;
  lessons: Lesson[];
  progress: ProgressStore;
};

type PathItemState = "completed" | "current" | "upcoming";

const orderedLessons = (lessons: Lesson[]) =>
  [...lessons].sort((left, right) => left.order - right.order);

const completedLessonIds = (progress: ProgressStore) =>
  new Set(progress.completions.map((completion) => completion.lessonId));

const itemState = (
  lessonId: string,
  activeLessonId: string,
  completedIds: Set<string>,
): PathItemState => {
  if (completedIds.has(lessonId)) {
    return "completed";
  }

  return lessonId === activeLessonId ? "current" : "upcoming";
};

const StateIcon = ({ state }: { state: PathItemState }) => {
  if (state === "completed") {
    return <CheckCircle2 size={17} aria-hidden="true" />;
  }

  if (state === "current") {
    return <PlayCircle size={17} aria-hidden="true" />;
  }

  return <Circle size={17} aria-hidden="true" />;
};

const stateLabel = (state: PathItemState) => {
  const labels: Record<PathItemState, string> = {
    completed: "Completed",
    current: "Next to do",
    upcoming: "Upcoming",
  };

  return labels[state];
};

function CurriculumPath({
  activeLessonId,
  lessons,
  progress,
}: CurriculumPathProps) {
  const sortedLessons = orderedLessons(lessons);
  const completedIds = completedLessonIds(progress);
  const activeIndex = sortedLessons.findIndex(
    (lesson) => lesson.id === activeLessonId,
  );
  const currentPosition = activeIndex >= 0 ? activeIndex + 1 : 1;

  return (
    <section className="curriculum-path" aria-labelledby="curriculum-path-title">
      <div className="curriculum-path-heading">
        <div>
          <p className="eyebrow">Curriculum path</p>
          <h2 id="curriculum-path-title">Lesson queue</h2>
        </div>
        <span>
          Lesson {currentPosition} of {sortedLessons.length}
        </span>
      </div>

      <ol className="curriculum-path-list">
        {sortedLessons.map((lesson) => {
          const state = itemState(lesson.id, activeLessonId, completedIds);

          return (
            <li
              className={`curriculum-path-item curriculum-path-${state}`}
              key={lesson.id}
              aria-current={state === "current" ? "step" : undefined}
            >
              <StateIcon state={state} />
              <div>
                <span>{stateLabel(state)}</span>
                <strong>{lesson.title}</strong>
                <small>
                  Lesson {lesson.order} of {sortedLessons.length} ·{" "}
                  {lesson.arcTitle} · Arc step {lesson.day} of{" "}
                  {lesson.arcLength}
                </small>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default CurriculumPath;
