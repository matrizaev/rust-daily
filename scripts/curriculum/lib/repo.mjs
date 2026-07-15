import { spawnSync } from "node:child_process";
import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LIB_DIR = dirname(fileURLToPath(import.meta.url));
export const CURRICULUM_DIR = dirname(LIB_DIR);
export const SCRIPTS_DIR = dirname(CURRICULUM_DIR);
export const REPO_ROOT = dirname(SCRIPTS_DIR);
export const FRONTEND_DIR = join(REPO_ROOT, "frontend");
export const LESSONS_ROOT = process.env.LESSONS_ROOT_OVERRIDE
  ? resolve(process.env.LESSONS_ROOT_OVERRIDE)
  : join(REPO_ROOT, "lessons");
export const DEFAULT_BASE = "origin/main";

export const pathExists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

export const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
export const writeJson = async (path, value) =>
  writeFile(path, `${JSON.stringify(value, null, 2)}\n`);

export const uniqueSorted = (values) => [...new Set(values)].sort();

export const exitFromResult = (result) => {
  if (result.signal) {
    return 1;
  }

  return result.status ?? 1;
};

export const splitLines = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

export const findLessonDirs = async () => {
  if (!(await pathExists(LESSONS_ROOT))) {
    return [];
  }

  const lessonDirs = [];
  const pendingDirs = [LESSONS_ROOT];

  while (pendingDirs.length > 0) {
    const root = pendingDirs.pop();
    const entries = await readdir(root, { withFileTypes: true });

    for (const entry of entries) {
      const path = join(root, entry.name);

      if (!entry.isDirectory()) {
        continue;
      }

      if (await pathExists(join(path, "lesson.json"))) {
        lessonDirs.push(path);
      } else {
        pendingDirs.push(path);
      }
    }
  }

  return lessonDirs.sort();
};

export const readLessonRecords = async () => {
  const dirs = await findLessonDirs();
  const records = await Promise.all(
    dirs.map(async (dir) => ({
      dir,
      relPath: relative(REPO_ROOT, dir).split("\\").join("/"),
      lesson: await readJson(join(dir, "lesson.json")),
    })),
  );

  return records.sort((left, right) =>
    (left.lesson.order ?? 0) - (right.lesson.order ?? 0) ||
    left.relPath.localeCompare(right.relPath),
  );
};

export const lessonRecordsByArc = async () => {
  const records = await readLessonRecords();
  const byArc = new Map();

  for (const record of records) {
    const arcRecords = byArc.get(record.lesson.arcId) ?? [];
    arcRecords.push(record);
    byArc.set(record.lesson.arcId, arcRecords);
  }

  return byArc;
};

export const changedFilesFromGit = (base = DEFAULT_BASE) => {
  const diff = spawnSync("git", ["diff", "--name-only", base, "--"], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (diff.status !== 0) {
    throw new Error(
      `Could not compare changes against ${base}.\n${diff.stderr || diff.stdout}`,
    );
  }

  const untracked = spawnSync(
    "git",
    ["ls-files", "--others", "--exclude-standard"],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (untracked.status !== 0) {
    throw new Error(`Could not list untracked files.\n${untracked.stderr || untracked.stdout}`);
  }

  return uniqueSorted([...splitLines(diff.stdout), ...splitLines(untracked.stdout)]);
};
