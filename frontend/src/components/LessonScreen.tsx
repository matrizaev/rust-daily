import { ArrowLeft, Package, Settings } from "lucide-react";
import { Suspense, lazy } from "react";
import CompletionPanel from "./CompletionPanel";
import HintPanel from "./HintPanel";
import LessonActions from "./LessonActions";
import ValidationPanel from "./ValidationPanel";
import { useLessonDraft } from "./lesson/useLessonDraft";
import { useLessonProgress } from "./lesson/useLessonProgress";
import { useLessonValidation } from "./lesson/useLessonValidation";
import { dependencySetDetailsForValidation } from "../validation/dependencySets";
import type { ProgressStore } from "../types/progress";
import type { Concept, Lesson } from "../types/lesson";

const loadCodeEditor = () =>
  import("./CodeEditor").then(({ CodeEditor }) => ({ default: CodeEditor }));
const CodeEditor = lazy(loadCodeEditor);

type LessonScreenProps = {
  lesson: Lesson;
  concept: Concept | null;
  progress: ProgressStore;
  editorFontSize: number;
  onOpenSettings: () => void;
  onProgressChange: () => void;
  onReturnHome: () => void;
};

const getFooterCheckCopy = () =>
  "Checks run locally in your browser and on the configured Rust runner.";

const EditorLoadingFallback = () => (
  <div className="code-editor code-editor-loading" aria-live="polite">
    <p>Loading editor…</p>
  </div>
);

type LessonTopbarProps = Pick<
  LessonScreenProps,
  "lesson" | "onOpenSettings" | "onReturnHome"
>;

const LessonTopbar = ({
  lesson,
  onOpenSettings,
  onReturnHome,
}: LessonTopbarProps) => (
  <header className="lesson-topbar">
    <div className="topbar-actions">
      <button className="icon-text-button" type="button" onClick={onReturnHome}>
        <ArrowLeft size={20} aria-hidden="true" />
        Home
      </button>

      <button className="icon-text-button" type="button" onClick={onOpenSettings}>
        <Settings size={19} aria-hidden="true" />
        Settings
      </button>
    </div>

    <div className="topbar-title">
      <span>{lesson.arcTitle}</span>
      <strong>
        Arc step {lesson.day} of {lesson.arcLength}
      </strong>
    </div>
  </header>
);

type LessonBriefProps = Pick<LessonScreenProps, "concept" | "lesson">;

const DependencySetBlock = ({ lesson }: { lesson: Lesson }) => {
  const dependencySet = dependencySetDetailsForValidation(lesson.validation);

  return (
    <div className="dependency-block">
      <span className="dependency-heading">
        <Package size={17} aria-hidden="true" />
        Dependencies
      </span>
      <strong>
        {dependencySet.name} ({dependencySet.id})
      </strong>
      <p>{dependencySet.summary}</p>

      {dependencySet.availableCrates.length > 0 ? (
        <ul className="dependency-crate-list" aria-label="Available external crates">
          {dependencySet.availableCrates.map((crateName) => (
            <li key={crateName}>
              <code>{crateName}</code>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

const LessonBrief = ({ lesson, concept }: LessonBriefProps) => (
  <aside className="lesson-brief">
    <p className="eyebrow">One concept</p>
    <h1 id="lesson-title">{lesson.title}</h1>
    <p>{lesson.scenario}</p>

    <div className="instruction-block">
      <h2>Task</h2>
      <p>{lesson.instructions}</p>
    </div>

    <div className="concept-block">
      <span>Concept</span>
      <strong>{concept?.name ?? lesson.conceptId}</strong>
    </div>

    <DependencySetBlock lesson={lesson} />
  </aside>
);

const WorkspaceFooter = ({
  checkCopy,
  saveStatus,
}: {
  checkCopy: string;
  saveStatus: string;
}) => (
  <div className="workspace-footer">
    <p aria-live="polite">{saveStatus}</p>
    <p>{checkCopy}</p>
  </div>
);

const ReadonlyFilesPanel = ({ lesson }: { lesson: Lesson }) => {
  const readonlyFiles = lesson.files.filter((file) => file.role !== "editable");

  if (readonlyFiles.length === 0) {
    return null;
  }

  return (
    <section className="readonly-files" aria-label="Read-only lesson files">
      {readonlyFiles.map((file) => (
        <details key={file.path}>
          <summary>{file.path}</summary>
          <pre>
            <code>{file.content}</code>
          </pre>
        </details>
      ))}
    </section>
  );
};

/** Main lesson workspace with editor, context files, hints, and validation. */
export function LessonScreen(props: LessonScreenProps) {
  const {
    concept,
    lesson,
    editorFontSize,
    onOpenSettings,
    onProgressChange,
    onReturnHome,
    progress,
  } = props;
  const draft = useLessonDraft(lesson);
  const lessonProgress = useLessonProgress({
    concept,
    lesson,
    onProgressChange,
    progress,
    revealedHints: draft.revealedHints,
  });
  const validation = useLessonValidation({
    code: draft.code,
    filePath: draft.filePath,
    lesson,
    onPassedValidation: lessonProgress.recordCompletion,
    onValidationAttempt: lessonProgress.recordValidation,
  });

  const footerCheckCopy = getFooterCheckCopy();
  const checkStatus =
    validation.state.kind === "result" ? validation.state.result.status : null;

  return (
    <main className="app-shell lesson-shell">
      <LessonTopbar
        lesson={lesson}
        onOpenSettings={onOpenSettings}
        onReturnHome={onReturnHome}
      />

      <section className="lesson-layout" aria-labelledby="lesson-title">
        <LessonBrief concept={concept} lesson={lesson} />

        <section className="coding-workspace" aria-label="Lesson editor">
          <LessonActions
            canCheck={validation.canCheck}
            canRevealHint={draft.revealedHints < lesson.hints.length}
            checkStatus={checkStatus}
            isChecking={validation.isChecking}
            onCheck={validation.handleCheck}
            onReset={draft.handleReset}
            onRevealHint={draft.handleRevealHint}
          />

          <div className="editor-file-header" aria-label="Editable file">
            <span>{draft.filePath}</span>
          </div>

          <Suspense fallback={<EditorLoadingFallback />}>
            <CodeEditor
              key={lesson.id}
              ariaLabel={`${lesson.title} ${draft.filePath} Rust editor`}
              fontSize={editorFontSize}
              value={draft.code}
              onChange={draft.setCode}
            />
          </Suspense>

          <ReadonlyFilesPanel lesson={lesson} />

          <WorkspaceFooter
            checkCopy={footerCheckCopy}
            saveStatus={lessonProgress.progressStorageError
              ? `Progress not saved locally: ${lessonProgress.progressStorageError}.`
              : draft.saveStatus}
          />
          <ValidationPanel state={validation.state} />
          <CompletionPanel
            completedNow={lessonProgress.completedNow}
            completion={lessonProgress.completion}
            lesson={lesson}
            onReturnHome={onReturnHome}
          />

          <HintPanel hints={lesson.hints} revealedCount={draft.revealedHints} />
        </section>
      </section>
    </main>
  );
}
