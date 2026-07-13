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

export const repoRelativePath = (path) =>
  relative(REPO_ROOT, path).split("\\").join("/");

export const uniqueSorted = (values) => [...new Set(values)].sort();

export const runCommand = (
  command,
  args,
  { cwd = REPO_ROOT, env = process.env, stdio = "inherit" } = {},
) => spawnSync(command, args, { cwd, env, stdio });

export const captureCommand = (
  command,
  args,
  { cwd = REPO_ROOT, env = process.env } = {},
) => spawnSync(command, args, {
  cwd,
  env,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

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

const findLessonDirsIn = async (root) => {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await readdir(root, { withFileTypes: true });
  const childResults = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);

      if (!entry.isDirectory()) {
        return [];
      }

      if (await pathExists(join(path, "lesson.json"))) {
        return [path];
      }

      return findLessonDirsIn(path);
    }),
  );

  return childResults.flat().sort();
};

export const findLessonDirs = () => findLessonDirsIn(LESSONS_ROOT);

export const readLessonRecords = async () => {
  const dirs = await findLessonDirs();
  const records = await Promise.all(
    dirs.map(async (dir) => ({
      dir,
      relPath: repoRelativePath(dir),
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
  const diff = captureCommand("git", ["diff", "--name-only", base, "--"]);

  if (diff.status !== 0) {
    throw new Error(
      `Could not compare changes against ${base}.\n${diff.stderr || diff.stdout}`,
    );
  }

  const untracked = captureCommand("git", [
    "ls-files",
    "--others",
    "--exclude-standard",
  ]);

  if (untracked.status !== 0) {
    throw new Error(`Could not list untracked files.\n${untracked.stderr || untracked.stdout}`);
  }

  return uniqueSorted([...splitLines(diff.stdout), ...splitLines(untracked.stdout)]);
};

export const executableNodeArgs = (script, args = []) => [script, ...args];

