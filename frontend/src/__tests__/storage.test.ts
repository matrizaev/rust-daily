import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearAllDrafts,
  clearDraft,
  loadDraft,
  saveDraft,
} from "../storage/draftStore";
import {
  clampEditorFontSize,
  loadSettings,
  resolveThemePreference,
  saveSettings,
} from "../storage/settingsStore";
import {
  downloadProgressExport,
  readProgressExportFile,
} from "../storage/progressPortability";
import type { ProgressStore } from "../types/progress";

const progress = {
  version: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  attempts: [],
  completions: [],
  concepts: {},
} as unknown as ProgressStore;

const mockMatchMedia = (dark: boolean, reducedMotion = false) => {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn((query: string) => ({
      matches: query.includes("prefers-color-scheme")
        ? dark
        : reducedMotion,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("draft storage", () => {
  it("saves, loads, and clears drafts", () => {
    const saved = saveDraft("lesson-1", "pub fn main() {}", "src/main.rs");

    expect(saved).toMatchObject({
      ok: true,
      record: {
      lessonId: "lesson-1",
      code: "pub fn main() {}",
      files: { "src/main.rs": "pub fn main() {}" },
      },
    });
    expect(loadDraft("lesson-1")).toMatchObject({
      files: { "src/main.rs": "pub fn main() {}" },
    });

    clearDraft("lesson-1");
    expect(loadDraft("lesson-1")).toBeNull();
  });

  it("normalizes legacy code-only drafts and ignores invalid records", () => {
    window.localStorage.setItem(
      "rust-daily:v1:draft:lesson-1",
      JSON.stringify({ lessonId: "lesson-1", code: "pub fn old() {}" }),
    );
    window.localStorage.setItem(
      "rust-daily:v1:draft:lesson-2",
      JSON.stringify({ lessonId: "wrong", code: "pub fn old() {}" }),
    );

    expect(loadDraft("lesson-1")).toMatchObject({
      code: "pub fn old() {}",
      files: { "src/lib.rs": "pub fn old() {}" },
    });
    expect(loadDraft("lesson-2")).toBeNull();
  });

  it("clears only Rust Daily draft keys", () => {
    saveDraft("lesson-1", "one");
    saveDraft("lesson-2", "two");
    window.localStorage.setItem("other-key", "keep");

    expect(clearAllDrafts()).toBe(2);
    expect(window.localStorage.getItem("other-key")).toBe("keep");
  });

  it("returns typed storage failures instead of reporting a successful save", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("full", "QuotaExceededError");
    });

    expect(saveDraft("lesson-1", "code")).toEqual({
      ok: false,
      reason: "quota",
    });
  });
});

describe("settings storage", () => {
  it("loads defaults, clamps saved font size, and resolves system theme", () => {
    mockMatchMedia(true, true);

    expect(loadSettings()).toMatchObject({
      theme: "dark",
      editorFontSize: 16,
      reducedMotion: true,
    });
    expect(clampEditorFontSize(99)).toBe(22);
    expect(clampEditorFontSize(10.2)).toBe(14);
    expect(resolveThemePreference("system")).toBe("dark");
    expect(resolveThemePreference("light")).toBe("light");

    expect(
      saveSettings({
        version: 1,
        theme: "light",
        editorFontSize: 99,
        reducedMotion: false,
      }),
    ).toBe(true);
    expect(loadSettings()).toMatchObject({
      theme: "light",
      editorFontSize: 22,
      reducedMotion: false,
    });
  });

  it("falls back to defaults for invalid settings", () => {
    window.localStorage.setItem(
      "rust-daily:v1:settings",
      JSON.stringify({ version: 1, theme: "sepia" }),
    );

    expect(loadSettings()).toMatchObject({
      version: 1,
      theme: "dark",
      editorFontSize: 16,
    });
  });
});

describe("progress portability", () => {
  it("reads wrapped and raw progress exports", async () => {
    const wrapped = new File(
      [
        JSON.stringify({
          kind: "rust-daily-progress-export",
          version: 1,
          exportedAt: "2026-07-11T00:00:00.000Z",
          progress,
        }),
      ],
      "progress.json",
    );
    const raw = new File([JSON.stringify(progress)], "progress.json");

    await expect(readProgressExportFile(wrapped)).resolves.toEqual(progress);
    await expect(readProgressExportFile(raw)).resolves.toEqual(progress);
    await expect(
      readProgressExportFile(new File(["{}"], "broken.json")),
    ).rejects.toThrow("Choose a valid Rust Daily progress export JSON file.");
  });

  it("downloads progress exports as dated JSON files", () => {
    vi.useFakeTimers();
    const nativeUrl = globalThis.URL;
    const createObjectURL = vi.fn(() => "blob:progress");
    const revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    vi.stubGlobal("URL", {
      ...nativeUrl,
      createObjectURL,
      revokeObjectURL,
    });

    downloadProgressExport(progress, new Date("2026-07-11T12:00:00.000Z"));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(click).toHaveBeenCalled();
    expect(document.querySelector("a")).toBeNull();

    vi.runOnlyPendingTimers();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:progress");
  });
});
