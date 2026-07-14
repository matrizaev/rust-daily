import { useCallback, useEffect, useState } from "react";
import {
  loadSettings,
  resolveThemePreference,
  saveSettings,
  type EffectiveTheme,
  type UserSettings,
} from "../storage/settingsStore";

const getSystemTheme = (): EffectiveTheme => resolveThemePreference("system");

const useEffectiveTheme = (settings: UserSettings) => {
  const [systemTheme, setSystemTheme] = useState<EffectiveTheme>(getSystemTheme);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const updateSystemTheme = () =>
      setSystemTheme(media.matches ? "dark" : "light");

    updateSystemTheme();
    media.addEventListener("change", updateSystemTheme);

    return () => media.removeEventListener("change", updateSystemTheme);
  }, []);

  return settings.theme === "system" ? systemTheme : settings.theme;
};

export const useSettingsState = () => {
  const [settings, setSettings] = useState(() => loadSettings());
  const effectiveTheme = useEffectiveTheme(settings);

  useEffect(() => {
    document.documentElement.dataset.theme = effectiveTheme;
    document.documentElement.dataset.reducedMotion = settings.reducedMotion
      ? "true"
      : "false";
  }, [effectiveTheme, settings.reducedMotion]);

  const handleSettingsChange = useCallback((nextSettings: UserSettings) => {
    setSettings(nextSettings);
    saveSettings(nextSettings);
  }, []);

  return {
    settings,
    handleSettingsChange,
  };
};
