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

const renderSettings = (onDeleteProgress: () => boolean) =>
  render(
    <SettingsScreen
      settings={settings}
      summary={summary}
      onDeleteDrafts={() => 0}
      onDeleteProgress={onDeleteProgress}
      onExportProgress={() => undefined}
      onImportProgress={async () => ({ ok: true, message: "Imported." })}
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
    renderSettings(onDeleteProgress);

    fireEvent.click(screen.getByRole("button", { name: "Delete progress" }));

    expect(confirm).toHaveBeenCalledWith(
      "Delete all local progress for Rust Daily?",
    );
    expect(onDeleteProgress).not.toHaveBeenCalled();
  });

  it("deletes progress after confirmation", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDeleteProgress = vi.fn(() => true);
    renderSettings(onDeleteProgress);

    fireEvent.click(screen.getByRole("button", { name: "Delete progress" }));

    expect(onDeleteProgress).toHaveBeenCalledOnce();
    expect(screen.getByText("Progress deleted.")).toBeTruthy();
  });
});
