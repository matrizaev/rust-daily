import { ArrowLeft, Settings } from "lucide-react";
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CompletionPanel from "./CompletionPanel";
import HintPanel from "./HintPanel";
import LessonActions from "./LessonActions";
import ValidationPanel, {
  type ValidationPanelState,
} from "./ValidationPanel";
import {
  getLessonCompletion,
} from "../progress/progressSelectors";
import {
  ensureLessonAttempt,
  recordHintReveal,
  recordLessonCompletion,
  recordValidationAttempt,
} from "../progress/progressStore";
import type { ProgressStore } from "../types/progress";
import {
  clearDraft,
  loadDraft,
  saveDraft,
  type DraftRecord,
} from "../storage/draftStore";
import type { Concept, Lesson } from "../types/lesson";
import type { LessonValidation, ValidationResult } from "../types/validation";
import { runValidation } from "../validation/validationClient";

const SAVE_DELAY_MS = 450;
const DEFAULT_EDITABLE_PATH = "src/lib.rs";
const loadCodeEditor = () => import("./CodeEditor");
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

type DraftState = {
  code: string;
  filePath: string;
  lastSavedAt: string | null;
};

const getPrimaryEditableFile = (lesson: Lesson) =>
  lesson.files.find((file) => file.role === "editable") ?? {
    path: DEFAULT_EDITABLE_PATH,
    role: "editable" as const,
    content: lesson.starterCode,
  };

const getStarterDraftState = (lesson: Lesson): DraftState => ({
  code: getPrimaryEditableFile(lesson).content,
  filePath: getPrimaryEditableFile(lesson).path,
  lastSavedAt: null,
});

const draftRecordToState = (lesson: Lesson, draft: DraftRecord): DraftState => ({
  code: draft.files[getPrimaryEditableFile(lesson).path] ?? draft.code,
  filePath: getPrimaryEditableFile(lesson).path,
  lastSavedAt: draft.updatedAt,
});

const getDraftState = (lesson: Lesson): DraftState => {
  const draft = loadDraft(lesson.id);

  return draft === null
    ? getStarterDraftState(lesson)
    : draftRecordToState(lesson, draft);
};

const formatSavedAt = (savedAt: string | null) =>
  savedAt
    ? `Draft saved ${new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(savedAt))}`
    : "Draft will save locally";

const persistDraft = (lesson: Lesson, filePath: string, code: string) => {
  if (code === getPrimaryEditableFile(lesson).content) {
    clearDraft(lesson.id);
    return null;
  }

  return saveDraft(lesson.id, code, filePath)?.updatedAt ?? null;
};

const idleValidationState: ValidationPanelState = {
  kind: "idle",
};

const runningValidationState: ValidationPanelState = {
  kind: "running",
};

const resultState = (
  result: ValidationResult,
  stale: boolean,
): ValidationPanelState => ({
  kind: "result",
  result,
  stale,
});

const unsupportedResult = (): ValidationResult => ({
  status: "unsupported",
  durationMs: 0,
  summary: "This lesson cannot be checked in the browser yet.",
  diagnostics: "",
  failures: [],
});

const getFooterCheckCopy = () =>
  "Checks run locally in your browser and on the configured Rust runner.";

const EditorLoadingFallback = () => (
  <div className="code-editor code-editor-loading" aria-live="polite">
    <p>Loading editor…</p>
  </div>
);

const shouldCompleteLesson = (result: ValidationResult) =>
  result.status === "passed" || result.status === "self_check";

const buildValidationRequest = (
  lesson: Lesson,
  validation: LessonValidation,
  code: string,
  filePath: string,
) => ({
  lessonId: lesson.id,
  validation,
  files: Object.fromEntries(
    lesson.files.map((file) => [
      file.path,
      file.path === filePath ? code : file.content,
    ]),
  ),
});

const shouldMarkStale = (
  state: ValidationPanelState,
  checkedCode: string | null,
  code: string,
) => {
  return (
    state.kind === "result" &&
    !state.stale &&
    checkedCode !== null &&
    checkedCode !== code
  );
};

const staleStateForCodeChange = (
  state: ValidationPanelState,
  checkedCode: string | null,
  code: string,
) => {
  return shouldMarkStale(state, checkedCode, code) && state.kind === "result"
    ? resultState(state.result, true)
    : state;
};

const useLessonDraft = (lesson: Lesson) => {
  const initialDraft = useMemo(() => getDraftState(lesson), [lesson]);

  const [code, setCode] = useState(initialDraft.code);
  const [filePath, setFilePath] = useState(initialDraft.filePath);
  const [revealedHints, setRevealedHints] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(initialDraft.lastSavedAt);

  useEffect(() => {
    const nextDraft = getDraftState(lesson);

    setCode(nextDraft.code);
    setFilePath(nextDraft.filePath);
    setLastSavedAt(nextDraft.lastSavedAt);
    setRevealedHints(0);
  }, [lesson]);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      setLastSavedAt(persistDraft(lesson, filePath, code));
    }, SAVE_DELAY_MS);

    return () => window.clearTimeout(saveTimer);
  }, [code, filePath, lesson]);

  const handleReset = useCallback(() => {
    const editableFile = getPrimaryEditableFile(lesson);

    clearDraft(lesson.id);
    setCode(editableFile.content);
    setFilePath(editableFile.path);
    setLastSavedAt(null);
    setRevealedHints(0);
  }, [lesson]);

  const handleRevealHint = useCallback(() => {
    setRevealedHints((current) => {
      const next = Math.min(current + 1, lesson.hints.length);

      return next;
    });
  }, [lesson.hints.length]);

  return {
    code,
    filePath,
    revealedHints,
    saveStatus: formatSavedAt(lastSavedAt),
    setCode,
    handleReset,
    handleRevealHint,
  };
};

const useValidationRunner = (
  lesson: Lesson,
  concept: Concept | null,
  code: string,
  filePath: string,
  onProgressChange: () => void,
  onCompleteNow: () => void,
) => {
  const [state, setState] = useState<ValidationPanelState>(idleValidationState);
  const [checkedCode, setCheckedCode] = useState<string | null>(null);
  const codeRef = useRef(code);

  useEffect(() => {
    codeRef.current = code;
  }, [code]);

  useEffect(() => {
    setState(idleValidationState);
    setCheckedCode(null);
  }, [lesson.id]);

  useEffect(() => {
    setState((current) =>
      staleStateForCodeChange(current, checkedCode, code),
    );
  }, [checkedCode, code]);

  const handleCheck = useCallback(async () => {
    const { validation } = lesson;
    const requestCode = codeRef.current;

    recordValidationAttempt(lesson.id);
    onProgressChange();

    if (!validation) {
      setState(resultState(unsupportedResult(), false));
      setCheckedCode(requestCode);
      return;
    }

    setState(runningValidationState);

    const result = await runValidation(
      buildValidationRequest(lesson, validation, requestCode, filePath),
    );

    setCheckedCode(requestCode);
    setState(resultState(result, codeRef.current !== requestCode));

    if (shouldCompleteLesson(result)) {
      const completion = recordLessonCompletion(lesson, concept);

      if (completion.completedNow) {
        onCompleteNow();
      }

      onProgressChange();
    }
  }, [concept, filePath, lesson, onCompleteNow, onProgressChange]);

  return {
    canCheck: Boolean(lesson.validation),
    handleCheck,
    isChecking: state.kind === "running",
    state,
  };
};

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

function LessonScreen(props: LessonScreenProps) {
  const {
    concept,
    lesson,
    editorFontSize,
    onOpenSettings,
    onProgressChange,
    onReturnHome,
    progress,
  } = props;
  const [completedNow, setCompletedNow] = useState(false);
  const completion = getLessonCompletion(progress, lesson.id);

  useEffect(() => {
    ensureLessonAttempt(lesson.id);
    onProgressChange();
    setCompletedNow(false);
  }, [lesson.id, onProgressChange]);

  const handleCompleteNow = useCallback(() => {
    setCompletedNow(true);
  }, []);

  const draft = useLessonDraft(lesson);

  useEffect(() => {
    if (draft.revealedHints > 0) {
      recordHintReveal(lesson.id, draft.revealedHints);
      onProgressChange();
    }
  }, [draft.revealedHints, lesson.id, onProgressChange]);

  const validation = useValidationRunner(
    lesson,
    concept,
    draft.code,
    draft.filePath,
    onProgressChange,
    handleCompleteNow,
  );

  const footerCheckCopy = getFooterCheckCopy();

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
            isChecking={validation.isChecking}
            onCheck={validation.handleCheck}
            onReset={draft.handleReset}
            onRevealHint={draft.handleRevealHint}
          />

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
            saveStatus={draft.saveStatus}
          />
          <ValidationPanel state={validation.state} />
          <CompletionPanel
            completedNow={completedNow}
            completion={completion}
            lesson={lesson}
            onReturnHome={onReturnHome}
          />

          <HintPanel hints={lesson.hints} revealedCount={draft.revealedHints} />
        </section>
      </section>
    </main>
  );
}

// fallow-ignore-next-line unused-export
export default LessonScreen;
