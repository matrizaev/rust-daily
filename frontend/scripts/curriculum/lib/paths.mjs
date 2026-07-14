import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const FRONTEND_DIR = join(SCRIPT_DIR, "..", "..", "..");
const REPO_ROOT = join(FRONTEND_DIR, "..");

export const LESSONS_ROOT = process.env.LESSONS_ROOT_OVERRIDE
  ? resolve(process.env.LESSONS_ROOT_OVERRIDE)
  : join(REPO_ROOT, "lessons");

export const FRONTEND_LESSONS_PATH = join(
  FRONTEND_DIR,
  "src",
  "content",
  "lessons.json",
);
export const FRONTEND_LESSON_INDEX_PATH = join(
  FRONTEND_DIR,
  "src",
  "content",
  "lessonIndex.json",
);
export const FRONTEND_LESSON_DETAILS_DIR = join(
  FRONTEND_DIR,
  "public",
  "content",
  "lessons",
);
export const FRONTEND_CONCEPTS_PATH = join(
  FRONTEND_DIR,
  "src",
  "content",
  "concepts.json",
);
export const FRONTEND_CONTENT_REVISION_PATH = join(
  FRONTEND_DIR,
  "src",
  "content",
  "contentRevision.json",
);
export const SOURCE_CONCEPTS_PATH = join(LESSONS_ROOT, "concepts.json");
export const SOURCE_ARCS_PATH = join(LESSONS_ROOT, "arcs.json");

export const repoRelativePath = (path) => relative(REPO_ROOT, path);
