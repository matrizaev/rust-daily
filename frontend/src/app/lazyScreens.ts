export const loadLessonScreen = () =>
  import("../components/LessonScreen").then(({ LessonScreen }) => ({
    default: LessonScreen,
  }));

export const loadSettingsScreen = () =>
  import("../components/SettingsScreen").then(({ SettingsScreen }) => ({
    default: SettingsScreen,
  }));
