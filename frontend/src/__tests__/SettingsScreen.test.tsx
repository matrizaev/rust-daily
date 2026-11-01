import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsScreen } from "../components/SettingsScreen";

const settings = {
  version: 1 as const,
  theme: "dark" as const,
  editorFontSize: 16,
  reducedMotion: false,
};

const summary = {
  currentStreak: 0,
  completedToday: false,
  completedLessons: 0,
  conceptsIntroduced: 0,
};

const renderSettings = ({
  onDeleteDrafts = () => 0,
  onDeleteProgress = () => true,
  onExportProgress = () => undefined,
  onImportProgress = async () => ({ ok: true, message: "Progress imported." }),
}: {
  onDeleteDrafts?: () => number;
  onDeleteProgress?: () => boolean;
  onExportProgress?: () => void;
  onImportProgress?: (file: File) => Promise<{ ok: boolean; message: string }>;
} = {}) =>
  render(
    <SettingsScreen
      settings={settings}
      summary={summary}
      onDeleteDrafts={onDeleteDrafts}
      onDeleteProgress={onDeleteProgress}
      onExportProgress={onExportProgress}
      onImportProgress={onImportProgress}
      onReturnHome={() => undefined}
      onSettingsChange={() => undefined}
    />,
  );

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("SettingsScreen", () => {
  it("does not delete progress when confirmation is cancelled", () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const onDeleteProgress = vi.fn(() => true);
    renderSettings({ onDeleteProgress });

    fireEvent.click(screen.getByRole("button", { name: "Delete progress" }));

    expect(confirm).toHaveBeenCalledWith(
      "Delete all local progress for Rust Daily?",
    );
    expect(onDeleteProgress).not.toHaveBeenCalled();
    expect(screen.getByRole("status").textContent).toContain(
      "Progress deletion canceled.",
    );
  });

  it("deletes progress after confirmation", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDeleteProgress = vi.fn(() => true);
    renderSettings({ onDeleteProgress });

    fireEvent.click(screen.getByRole("button", { name: "Delete progress" }));

    expect(onDeleteProgress).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toContain(
      "Progress deleted.",
    );
  });

  it("confirms that progress export started", () => {
    const onExportProgress = vi.fn();
    renderSettings({ onExportProgress });

    fireEvent.click(screen.getByRole("button", { name: "Export progress" }));

    expect(onExportProgress).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toContain(
      "Progress export started.",
    );
  });

  it("confirms import selection and reports the import result", async () => {
    const onImportProgress = vi.fn(async () => ({
      ok: true,
      message: "Progress imported.",
    }));
    vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => { });
    renderSettings({ onImportProgress });

    fireEvent.click(screen.getByRole("button", { name: "Import progress" }));
    expect(screen.getByRole("status").textContent).toContain(
      "Choose a progress export JSON file to import.",
    );

    const file = new File(["{}"], "progress.json", {
      type: "application/json",
    });
    fireEvent.change(screen.getByLabelText("Progress export file"), {
      target: { files: [file] },
    });

    expect(await screen.findByText("Progress imported.")).toBeTruthy();
    expect(onImportProgress).toHaveBeenCalledWith(file);
  });

  it("reports draft deletion beside the local-data actions", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDeleteDrafts = vi.fn(() => 2);
    renderSettings({ onDeleteDrafts });

    fireEvent.click(screen.getByRole("button", { name: "Delete drafts" }));

    expect(onDeleteDrafts).toHaveBeenCalledOnce();
    expect(screen.getByRole("status").textContent).toContain(
      "2 draft entries deleted.",
    );
  });
});
