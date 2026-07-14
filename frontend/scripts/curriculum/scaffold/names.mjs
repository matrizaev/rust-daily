export const DEFAULT_TEST_PATH = "tests/public.rs";
export const VALID_DIFFICULTIES = new Set(["easy", "medium", "advanced"]);
export const ARC_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const unique = (values) => [...new Set(values)];

const caseFileName = (name) => `${name.replaceAll("-", "_")}.rs`;

export const compileFailCasePath = (name) => `compile_fail/${caseFileName(name)}`;

export const parseLessonName = (lessonName, errors) => {
  const match = /^(\d{3})-([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(lessonName ?? "");

  if (!match) {
    errors.push("--lesson must use <number>-<slug>, for example 091-borrowed-config-view.");
    return null;
  }

  return {
    numberText: match[1],
    number: Number.parseInt(match[1], 10),
    slug: match[2],
  };
};

export const lessonIdFromName = (lessonName) =>
  lessonName ? `${lessonName.slug}-${lessonName.numberText}` : "";

export const lessonOrderFromName = (lessonName) =>
  lessonName ? lessonName.number : 0;
