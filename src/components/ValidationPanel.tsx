import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Info,
  LoaderCircle,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ValidationResult, ValidationStatus } from "../types/validation";

export type ValidationPanelState =
  | {
      kind: "idle";
    }
  | {
      kind: "running";
    }
  | {
      kind: "result";
      result: ValidationResult;
      stale: boolean;
    };

type ValidationPanelProps = {
  state: ValidationPanelState;
};

const statusLabel: Record<ValidationStatus, string> = {
  passed: "Passed",
  failed: "Needs changes",
  timeout: "Timed out",
  unsupported: "Unavailable",
  internal_error: "Check failed",
};

const panelTone = (state: ValidationPanelState) =>
  state.kind === "result" ? state.result.status : state.kind;

const statusIcon: Record<string, ReactNode> = {
  idle: <Info size={20} aria-hidden="true" />,
  running: <LoaderCircle size={20} aria-hidden="true" />,
  passed: <CheckCircle2 size={20} aria-hidden="true" />,
  failed: <AlertTriangle size={20} aria-hidden="true" />,
  timeout: <Clock3 size={20} aria-hidden="true" />,
  unsupported: <Info size={20} aria-hidden="true" />,
  internal_error: <AlertTriangle size={20} aria-hidden="true" />,
};

const panelTitle = (state: ValidationPanelState) => {
  if (state.kind === "idle") {
    return "Check";
  }

  if (state.kind === "running") {
    return "Checking";
  }

  return statusLabel[state.result.status];
};

const panelSummary = (state: ValidationPanelState) => {
  if (state.kind === "idle") {
    return "Run Check when you are ready.";
  }

  if (state.kind === "running") {
    return "Checking your code...";
  }

  return state.result.summary;
};

const FailureList = ({ result }: { result: ValidationResult }) =>
  result.failures.length > 0 ? (
    <ul className="validation-failures">
      {result.failures.map((failure) => (
        <li key={`${failure.name}-${failure.message}`}>{failure.message}</li>
      ))}
    </ul>
  ) : null;

const Diagnostics = ({ result }: { result: ValidationResult }) =>
  result.diagnostics ? (
    <pre className="validation-diagnostics">{result.diagnostics}</pre>
  ) : null;

const Duration = ({ result }: { result: ValidationResult }) => (
  <span>{result.durationMs} ms</span>
);

const isResultState = (
  state: ValidationPanelState,
): state is Extract<ValidationPanelState, { kind: "result" }> =>
  state.kind === "result";

const ResultDuration = ({ state }: ValidationPanelProps) =>
  isResultState(state) ? <Duration result={state.result} /> : null;

const StaleNotice = ({ state }: ValidationPanelProps) =>
  isResultState(state) && state.stale ? (
    <p className="validation-stale">Code changed since this check.</p>
  ) : null;

const ResultDetails = ({ state }: ValidationPanelProps) =>
  isResultState(state) ? (
    <>
      <FailureList result={state.result} />
      <Diagnostics result={state.result} />
    </>
  ) : null;

function ValidationPanel({ state }: ValidationPanelProps) {
  const tone = panelTone(state);

  return (
    <section
      className={`validation-panel validation-${tone}`}
      aria-labelledby="validation-title"
      aria-live="polite"
    >
      <div className="validation-heading">
        <div className="validation-title-row">
          {statusIcon[tone]}
          <h2 id="validation-title">{panelTitle(state)}</h2>
        </div>
        <ResultDuration state={state} />
      </div>

      <p>{panelSummary(state)}</p>
      <StaleNotice state={state} />
      <ResultDetails state={state} />
    </section>
  );
}

export default ValidationPanel;
