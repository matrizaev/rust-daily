import {
  ArrowLeft,
  Download,
  FileX2,
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

type SettingsScreenProps = {
  settings: UserSettings;
  summary: ProgressSummaryData;
  onDeleteDrafts: () => number;
  onDeleteProgress: () => void;
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

function SettingsScreen({
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
  const [status, setStatus] = useState(
    "Drafts, progress, and settings stay in this browser unless you export progress.",
  );

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
    onExportProgress();
    setStatus("Progress exported. Draft code was not included.");
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    setStatus("Importing progress...");
    const result = await onImportProgress(file);
    setStatus(result.message);
    input.value = "";
  };

  const handleDeleteProgress = () => {
    if (!window.confirm("Delete all local progress for Rust Daily?")) {
      return;
    }

    onDeleteProgress();
    setStatus("Local progress deleted.");
  };

  const handleDeleteDrafts = () => {
    if (!window.confirm("Delete all saved draft code for Rust Daily?")) {
      return;
    }

    const count = onDeleteDrafts();
    setStatus(`${count} draft ${count === 1 ? "entry" : "entries"} deleted.`);
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
              className="visually-hidden"
              ref={importInputRef}
              type="file"
              onChange={handleImportChange}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          id="local-data"
          title="Local data"
          description="Delete data stored by this browser. These actions cannot be undone."
        >
          <div className="settings-actions">
            <button
              className="danger-button"
              type="button"
              onClick={handleDeleteProgress}
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
        </SettingsSection>

        <p className="settings-status" aria-live="polite">
          {status}
        </p>
      </div>
    </main>
  );
}

// fallow-ignore-next-line unused-export
export default SettingsScreen;
