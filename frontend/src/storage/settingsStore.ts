export type ThemePreference = "dark" | "light" | "system";

export type EffectiveTheme = "dark" | "light";

export type UserSettings = {
  version: 1;
  theme: ThemePreference;
  editorFontSize: number;
  reducedMotion: boolean;
};

const SETTINGS_KEY = "rust-daily:v1:settings";

export const MIN_EDITOR_FONT_SIZE = 14;
export const MAX_EDITOR_FONT_SIZE = 22;
const DEFAULT_EDITOR_FONT_SIZE = 16;

const THEME_PREFERENCES = new Set<string>(["dark", "light", "system"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isThemePreference = (value: unknown): value is ThemePreference =>
  typeof value === "string" && THEME_PREFERENCES.has(value);

export const clampEditorFontSize = (fontSize: number) =>
  Math.min(
    MAX_EDITOR_FONT_SIZE,
    Math.max(MIN_EDITOR_FONT_SIZE, Math.round(fontSize)),
  );

const getPrefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

const getDefaultSettings = (): UserSettings => ({
  version: 1,
  theme: "dark",
  editorFontSize: DEFAULT_EDITOR_FONT_SIZE,
  reducedMotion: getPrefersReducedMotion(),
});

const settingsValidators = [
  (value: Record<string, unknown>) => value.version === 1,
  (value: Record<string, unknown>) => isThemePreference(value.theme),
  (value: Record<string, unknown>) =>
    typeof value.editorFontSize === "number",
  (value: Record<string, unknown>) => typeof value.reducedMotion === "boolean",
];

const hasSettingsFields = (value: Record<string, unknown>) =>
  settingsValidators.every((validator) => validator(value));

const normalizeSettings = (value: unknown): UserSettings | null => {
  if (!isRecord(value) || !hasSettingsFields(value)) {
    return null;
  }

  return {
    version: 1,
    theme: value.theme as ThemePreference,
    editorFontSize: clampEditorFontSize(value.editorFontSize as number),
    reducedMotion: value.reducedMotion as boolean,
  };
};

export const loadSettings = () => {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    const parsed = raw ? (JSON.parse(raw) as unknown) : null;

    return normalizeSettings(parsed) ?? getDefaultSettings();
  } catch {
    return getDefaultSettings();
  }
};

export const saveSettings = (settings: UserSettings) => {
  const normalized = normalizeSettings(settings);

  if (!normalized) {
    return false;
  }

  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
    return true;
  } catch {
    return false;
  }
};

export const resolveThemePreference = (
  theme: ThemePreference,
): EffectiveTheme => {
  if (theme !== "system") {
    return theme;
  }

  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};
