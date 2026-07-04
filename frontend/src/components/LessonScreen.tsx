import { ArrowLeft, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
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
  lastSavedAt: string | null;
};

const getStarterDraftState = (lesson: Lesson): DraftState => ({
  code: lesson.starterCode,
  lastSavedAt: null,
});

const draftRecordToState = (draft: DraftRecord): DraftState => ({
  code: draft.code,
  lastSavedAt: draft.updatedAt,
});

const getDraftState = (lesson: Lesson): DraftState => {
  const draft = loadDraft(lesson.id);

  return draft === null
    ? getStarterDraftState(lesson)
    : draftRecordToState(draft);
};

const formatSavedAt = (savedAt: string | null) =>
  savedAt
    ? `Draft saved ${new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date(savedAt))}`
    : "Draft will save locally";

const persistDraft = (lesson: Lesson, code: string) => {
  if (code === lesson.starterCode) {
    clearDraft(lesson.id);
    return null;
  }

  return saveDraft(lesson.id, code)?.updatedAt ?? null;
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

const isBackendBackedLesson = (lesson: Lesson) =>
  lesson.validation?.mode === "backend-cargo-test";

const getFooterCheckCopy = (lesson: Lesson) => {
  if (!isBackendBackedLesson(lesson)) {
    return "Checks run locally in your browser.";
  }

  return "Checks run on the configured Rust runner.";
};

const shouldCompleteLesson = (result: ValidationResult) =>
  result.status === "passed" || result.status === "self_check";

const buildValidationRequest = (
  lessonId: string,
  validation: LessonValidation,
  code: string,
) => ({
  lessonId,
  validation,
  files: {
    "src/lib.rs": code,
  },
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
  const [revealedHints, setRevealedHints] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(initialDraft.lastSavedAt);

  useEffect(() => {
    const nextDraft = getDraftState(lesson);

    setCode(nextDraft.code);
    setLastSavedAt(nextDraft.lastSavedAt);
    setRevealedHints(0);
  }, [lesson]);

  useEffect(() => {
    const saveTimer = window.setTimeout(() => {
      setLastSavedAt(persistDraft(lesson, code));
    }, SAVE_DELAY_MS);

    return () => window.clearTimeout(saveTimer);
  }, [code, lesson]);

  const handleReset = useCallback(() => {
    clearDraft(lesson.id);
    setCode(lesson.starterCode);
    setLastSavedAt(null);
    setRevealedHints(0);
  }, [lesson.id, lesson.starterCode]);

  const handleRevealHint = useCallback(() => {
    setRevealedHints((current) => {
      const next = Math.min(current + 1, lesson.hints.length);

      return next;
    });
  }, [lesson.hints.length]);

  return {
    code,
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
      buildValidationRequest(lesson.id, validation, requestCode),
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
  }, [concept, lesson, onCompleteNow, onProgressChange]);

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
        Today
      </button>

      <button className="icon-text-button" type="button" onClick={onOpenSettings}>
        <Settings size={19} aria-hidden="true" />
        Settings
      </button>
    </div>

    <div className="topbar-title">
      <span>{lesson.arcTitle}</span>
      <strong>
        Day {lesson.day} of {lesson.arcLength}
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
    onProgressChange,
    handleCompleteNow,
  );

  const footerCheckCopy = getFooterCheckCopy(lesson);

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

          <CodeEditor
            key={lesson.id}
            ariaLabel={`${lesson.title} Rust editor`}
            fontSize={editorFontSize}
            value={draft.code}
            onChange={draft.setCode}
          />

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

export default LessonScreen;
