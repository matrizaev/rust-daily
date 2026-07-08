import { CheckCircle2, ChevronDown, Circle, PlayCircle } from "lucide-react";
import { useMemo, useState } from "react";
import type { LessonIndexEntry } from "../types/lesson";
import type { ProgressStore } from "../types/progress";

type CurriculumPathProps = {
  activeLessonId: string;
  lessons: LessonIndexEntry[];
  onOpenLesson: (lessonId: string) => void;
  progress: ProgressStore;
};

type PathItemState = "completed" | "current" | "upcoming";

type ArcLessonGroup = {
  arcId: string;
  arcTitle: string;
  firstOrder: number;
  lessons: LessonIndexEntry[];
};

const orderedLessons = (lessons: LessonIndexEntry[]) =>
  [...lessons].sort((left, right) => left.order - right.order);

const orderedArcLessons = (lessons: LessonIndexEntry[]) =>
  [...lessons].sort(
    (left, right) => left.day - right.day || left.order - right.order,
  );

const groupedLessonsByArc = (lessons: LessonIndexEntry[]): ArcLessonGroup[] => {
  const groups = orderedLessons(lessons).reduce(
    (arcGroups, lesson) => {
      const existingGroup = arcGroups.get(lesson.arcId);

      if (existingGroup) {
        existingGroup.lessons.push(lesson);
        return arcGroups;
      }

      arcGroups.set(lesson.arcId, {
        arcId: lesson.arcId,
        arcTitle: lesson.arcTitle,
        firstOrder: lesson.order,
        lessons: [lesson],
      });

      return arcGroups;
    },
    new Map<string, ArcLessonGroup>(),
  );

  return [...groups.values()]
    .map((group) => ({
      ...group,
      lessons: orderedArcLessons(group.lessons),
    }))
    .sort((left, right) => left.firstOrder - right.firstOrder);
};

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

const PathItemContent = ({
  lesson,
  state,
  totalLessons,
}: {
  lesson: LessonIndexEntry;
  state: PathItemState;
  totalLessons: number;
}) => (
  <>
    <StateIcon state={state} />
    <div>
      <span>{stateLabel(state)}</span>
      <strong>{lesson.title}</strong>
      <small>
        Arc step {lesson.day} of {lesson.arcLength} · Queue lesson{" "}
        {lesson.order} of {totalLessons}
      </small>
    </div>
  </>
);

const ArcSummary = ({
  group,
  index,
  completedIds,
  isExpanded,
  isCurrent,
  onToggle,
}: {
  group: ArcLessonGroup;
  index: number;
  completedIds: Set<string>;
  isExpanded: boolean;
  isCurrent: boolean;
  onToggle: () => void;
}) => {
  const completedCount = group.lessons.filter((lesson) =>
    completedIds.has(lesson.id),
  ).length;
  const panelId = `curriculum-arc-panel-${group.arcId}`;

  return (
    <button
      className="curriculum-arc-toggle"
      type="button"
      aria-expanded={isExpanded}
      aria-controls={panelId}
      onClick={onToggle}
    >
      <span className="curriculum-arc-title">
        <span>{isCurrent ? "Current arc" : `Arc ${index + 1}`}</span>
        <strong>{group.arcTitle}</strong>
      </span>
      <span className="curriculum-arc-meta">
        {completedCount} of {group.lessons.length} complete
      </span>
      <ChevronDown
        className="curriculum-arc-chevron"
        size={18}
        aria-hidden="true"
      />
    </button>
  );
};

function CurriculumPath({
  activeLessonId,
  lessons,
  onOpenLesson,
  progress,
}: CurriculumPathProps) {
  const sortedLessons = useMemo(() => orderedLessons(lessons), [lessons]);
  const arcGroups = useMemo(() => groupedLessonsByArc(lessons), [lessons]);
  const [expandedArcId, setExpandedArcId] = useState<string | null>(null);
  const completedIds = useMemo(() => completedLessonIds(progress), [progress]);
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

      <ul className="curriculum-path-list">
        {arcGroups.map((group, index) => {
          const isCurrent = group.lessons.some(
            (lesson) => lesson.id === activeLessonId,
          );
          const isExpanded = expandedArcId === group.arcId;
          const arcClassName = `curriculum-arc${
            isExpanded ? " curriculum-arc-open" : ""
          }`;
          const panelId = `curriculum-arc-panel-${group.arcId}`;

          return (
            <li className={arcClassName} key={group.arcId}>
              <ArcSummary
                group={group}
                index={index}
                completedIds={completedIds}
                isExpanded={isExpanded}
                isCurrent={isCurrent}
                onToggle={() =>
                  setExpandedArcId(isExpanded ? null : group.arcId)
                }
              />

              <ol
                className="curriculum-path-lesson-list"
                id={panelId}
                hidden={!isExpanded}
              >
                {group.lessons.map((lesson) => {
                  const state = itemState(
                    lesson.id,
                    activeLessonId,
                    completedIds,
                  );
                  const isCompleted = state === "completed";

                  return (
                    <li
                      className={`curriculum-path-item curriculum-path-${state}`}
                      key={lesson.id}
                      aria-current={state === "current" ? "step" : undefined}
                    >
                      {isCompleted ? (
                        <button
                          className="curriculum-path-item-action"
                          type="button"
                          onClick={() => onOpenLesson(lesson.id)}
                          aria-label={`Open completed lesson ${lesson.title}`}
                        >
                          <PathItemContent
                            lesson={lesson}
                            state={state}
                            totalLessons={sortedLessons.length}
                          />
                        </button>
                      ) : (
                        <PathItemContent
                          lesson={lesson}
                          state={state}
                          totalLessons={sortedLessons.length}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default CurriculumPath;
