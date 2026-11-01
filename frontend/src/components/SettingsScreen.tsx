import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  Download,
  FileX2,
  Info,
  LoaderCircle,
  Trash2,
  Upload,
} from "lucide-react";
import {
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";
import type { ProgressSummary as ProgressSummaryData } from "../progress/progressSelectors";
import {
  clampEditorFontSize,
  MAX_EDITOR_FONT_SIZE,
  MIN_EDITOR_FONT_SIZE,
  type ThemePreference,
  type UserSettings,
} from "../storage/settingsStore";
import ProgressSummary from "./ProgressSummary";

type ImportResult = {
  ok: boolean;
  message: string;
};

type SettingsFeedback = {
  section: "progress" | "local-data";
  tone: "info" | "pending" | "success" | "error";
  message: string;
};

type SettingsScreenProps = {
  settings: UserSettings;
  summary: ProgressSummaryData;
  onDeleteDrafts: () => number;
  onDeleteProgress: () => boolean;
  onExportProgress: () => void;
  onImportProgress: (file: File) => Promise<ImportResult>;
  onReturnHome: () => void;
  onSettingsChange: (settings: UserSettings) => void;
};

type SettingsSectionProps = {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
};

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "dark", label: "Dark" },
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
];

const SettingsSection = ({
  id,
  title,
  description,
  children,
}: SettingsSectionProps) => (
  <section className="settings-section" aria-labelledby={`${id}-title`}>
    <div>
      <h2 id={`${id}-title`}>{title}</h2>
      <p>{description}</p>
    </div>
    {children}
  </section>
);

const SettingsFeedbackMessage = ({
  feedback,
}: {
  feedback: SettingsFeedback;
}) => {
  const Icon =
    feedback.tone === "success"
      ? CheckCircle2
      : feedback.tone === "error"
        ? CircleAlert
        : feedback.tone === "pending"
          ? LoaderCircle
          : Info;

  return (
    <p
      className="settings-feedback"
      data-tone={feedback.tone}
      role={feedback.tone === "error" ? "alert" : "status"}
    >
      <Icon size={18} aria-hidden="true" />
      <span>{feedback.message}</span>
    </p>
  );
};

/** Settings and local-data management screen. */
export function SettingsScreen({
  settings,
  summary,
  onDeleteDrafts,
  onDeleteProgress,
  onExportProgress,
  onImportProgress,
  onReturnHome,
  onSettingsChange,
}: SettingsScreenProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<SettingsFeedback | null>(null);

  const updateSettings = (next: UserSettings) => {
    onSettingsChange(next);
  };

  const handleThemeChange = (theme: ThemePreference) => {
    updateSettings({ ...settings, theme });
  };

  const handleFontSizeChange = (fontSize: number) => {
    updateSettings({
      ...settings,
      editorFontSize: clampEditorFontSize(fontSize),
    });
  };

  const handleReducedMotionChange = (reducedMotion: boolean) => {
    updateSettings({ ...settings, reducedMotion });
  };

  const handleExport = () => {
    try {
      onExportProgress();
      setFeedback({
        section: "progress",
        tone: "success",
        message: "Progress export started. Draft code was not included.",
      });
    } catch {
      setFeedback({
        section: "progress",
        tone: "error",
        message: "Progress export could not be created.",
      });
    }
  };

  const handleImportClick = () => {
    setFeedback({
      section: "progress",
      tone: "info",
      message: "Choose a progress export JSON file to import.",
    });
    importInputRef.current?.click();
  };

  const handleDeleteProgressClick = () => {
    if (!window.confirm("Delete all local progress for Rust Daily?")) {
      setFeedback({
        section: "local-data",
        tone: "info",
        message: "Progress deletion canceled. No data was changed.",
      });
      return;
    }

    const deleted = onDeleteProgress();
    setFeedback({
      section: "local-data",
      tone: deleted ? "success" : "error",
      message: deleted
        ? "Progress deleted."
        : "Progress could not be deleted because browser storage is unavailable.",
    });
  };

  const handleImportChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    setFeedback({
      section: "progress",
      tone: "pending",
      message: "Importing progress...",
    });
    try {
      const result = await onImportProgress(file);
      setFeedback({
        section: "progress",
        tone: result.ok ? "success" : "error",
        message: result.message,
      });
    } catch (error) {
      setFeedback({
        section: "progress",
        tone: "error",
        message:
          error instanceof Error ? error.message : "Progress import failed.",
      });
    } finally {
      input.value = "";
    }
  };

  const handleDeleteDrafts = () => {
    if (!window.confirm("Delete all saved draft code for Rust Daily?")) {
      setFeedback({
        section: "local-data",
        tone: "info",
        message: "Draft deletion canceled. No data was changed.",
      });
      return;
    }

    const count = onDeleteDrafts();
    setFeedback({
      section: "local-data",
      tone: count === 0 ? "info" : "success",
      message:
        count === 0
          ? "No saved draft code was found."
          : `${count} draft ${count === 1 ? "entry" : "entries"} deleted.`,
    });
  };

  return (
    <main className="app-shell settings-shell">
      <header className="settings-header">
        <button className="icon-text-button" type="button" onClick={onReturnHome}>
          <ArrowLeft size={20} aria-hidden="true" />
          Home
        </button>
        <div>
          <p className="eyebrow">Local settings</p>
          <h1>Settings</h1>
        </div>
      </header>

      <div className="settings-layout">
        <section className="settings-overview" aria-label="Local progress">
          <ProgressSummary summary={summary} />
          <p>
            Rust Daily stores settings, draft code, and progress in this
            browser. Checks run locally and send current code to the configured
            Rust runner.
          </p>
        </section>

        <SettingsSection
          id="appearance"
          title="Appearance"
          description="Choose the app theme and adjust the editor text size."
        >
          <fieldset className="settings-fieldset">
            <legend>Theme</legend>
            <div className="segmented-control" role="group" aria-label="Theme">
              {THEME_OPTIONS.map((option) => (
                <button
                  aria-pressed={settings.theme === option.value}
                  className="segmented-button"
                  key={option.value}
                  type="button"
                  onClick={() => handleThemeChange(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="range-control">
            <span>Editor font size</span>
            <strong>{settings.editorFontSize}px</strong>
            <input
              max={MAX_EDITOR_FONT_SIZE}
              min={MIN_EDITOR_FONT_SIZE}
              step={1}
              type="range"
              value={settings.editorFontSize}
              onChange={(event) =>
                handleFontSizeChange(Number(event.currentTarget.value))
              }
            />
          </label>
        </SettingsSection>

        <SettingsSection
          id="motion"
          title="Motion"
          description="Reduce non-essential movement across the app."
        >
          <label className="toggle-control">
            <input
              checked={settings.reducedMotion}
              type="checkbox"
              onChange={(event) =>
                handleReducedMotionChange(event.currentTarget.checked)
              }
            />
            <span>Reduced motion</span>
          </label>
        </SettingsSection>

        <SettingsSection
          id="progress"
          title="Progress"
          description="Export or import progress only. Draft code is not part of the export."
        >
          <div className="settings-control-group">
            <div className="settings-actions">
              <button className="primary-button" type="button" onClick={handleExport}>
                <Download size={19} aria-hidden="true" />
                Export progress
              </button>

              <button className="secondary-button" type="button" onClick={handleImportClick}>
                <Upload size={19} aria-hidden="true" />
                Import progress
              </button>

              <input
                accept="application/json,.json"
                aria-label="Progress export file"
                className="visually-hidden"
                ref={importInputRef}
                type="file"
                onChange={handleImportChange}
              />
            </div>
            {feedback?.section === "progress" ? (
              <SettingsFeedbackMessage feedback={feedback} />
            ) : null}
          </div>
        </SettingsSection>

        <SettingsSection
          id="local-data"
          title="Local data"
          description="Delete data stored by this browser. These actions cannot be undone."
        >
          <div className="settings-control-group">
            <div className="settings-actions">
              <button
                className="danger-button"
                type="button"
                onClick={handleDeleteProgressClick}
              >
                <Trash2 size={19} aria-hidden="true" />
                Delete progress
              </button>

              <button
                className="danger-button"
                type="button"
                onClick={handleDeleteDrafts}
              >
                <FileX2 size={19} aria-hidden="true" />
                Delete drafts
              </button>
            </div>
            {feedback?.section === "local-data" ? (
              <SettingsFeedbackMessage feedback={feedback} />
            ) : null}
          </div>
        </SettingsSection>
      </div>
    </main>
  );
}
