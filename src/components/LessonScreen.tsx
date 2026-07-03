import { ArrowLeft } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeEditor from "./CodeEditor";
import HintPanel from "./HintPanel";
import LessonActions from "./LessonActions";
import ValidationPanel, {
  type ValidationPanelState,
} from "./ValidationPanel";
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
    setRevealedHints((current) => Math.min(current + 1, lesson.hints.length));
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

const useValidationRunner = (lesson: Lesson, code: string) => {
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
  }, [lesson]);

  return {
    canCheck: Boolean(lesson.validation),
    handleCheck,
    isChecking: state.kind === "running",
    state,
  };
};

type LessonTopbarProps = Pick<LessonScreenProps, "lesson" | "onReturnHome">;

const LessonTopbar = ({ lesson, onReturnHome }: LessonTopbarProps) => (
  <header className="lesson-topbar">
    <button className="icon-text-button" type="button" onClick={onReturnHome}>
      <ArrowLeft size={20} aria-hidden="true" />
      Today
    </button>

    <div className="topbar-title">
      <span>{lesson.arcTitle}</span>
      <strong>
        Day {lesson.day} of {lesson.arcLength}
      </strong>
    </div>
  </header>
);

const LessonBrief = ({ lesson, concept }: Omit<LessonScreenProps, "onReturnHome">) => (
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

const WorkspaceFooter = ({ saveStatus }: { saveStatus: string }) => (
  <div className="workspace-footer">
    <p aria-live="polite">{saveStatus}</p>
    <p>Checks run locally in your browser.</p>
  </div>
);

function LessonScreen(props: LessonScreenProps) {
  const { concept, lesson, onReturnHome } = props;
  const draft = useLessonDraft(lesson);
  const validation = useValidationRunner(lesson, draft.code);

  return (
    <main className="app-shell lesson-shell">
      <LessonTopbar lesson={lesson} onReturnHome={onReturnHome} />

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
            value={draft.code}
            onChange={draft.setCode}
          />

          <WorkspaceFooter saveStatus={draft.saveStatus} />
          <ValidationPanel state={validation.state} />

          <HintPanel hints={lesson.hints} revealedCount={draft.revealedHints} />
        </section>
      </section>
    </main>
  );
}

export default LessonScreen;
