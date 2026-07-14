import { lstat, readdir, readFile, realpath } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { LESSONS_ROOT } from "./paths.mjs";
import { pathExists } from "./json-io.mjs";
import { isSafeRelativePath } from "./path-rules.mjs";

const matchingFile = (path, filename, entry) =>
  entry.isFile() && entry.name === filename ? [path] : [];

const findFilesForEntry = async (root, filename, entry) => {
  const path = join(root, entry.name);
  if (entry.isSymbolicLink()) {
    throw new Error(`Source corpus must not contain symlinks: ${path}`);
  }
  if (entry.isDirectory()) {
    return findFiles(path, filename);
  }
  return matchingFile(path, filename, entry);
};

const findFiles = async (root, filename) => {
  if (!(await pathExists(root))) {
    return [];
  }

  const entries = await readdir(root, { withFileTypes: true });
  const childResults = await Promise.all(
    entries.map((entry) => findFilesForEntry(root, filename, entry)),
  );

  return childResults.flat().sort();
};

export const findLessonJsonFiles = () => findFiles(LESSONS_ROOT, "lesson.json");

const assertSafeSourcePath = (sourcePath) => {
  if (!isSafeRelativePath(sourcePath)) {
    throw new Error(`${sourcePath} is not a safe relative source path.`);
  }
};

const assertNotSymlink = (sourcePath, metadata) => {
  if (metadata.isSymbolicLink()) {
    throw new Error(`${sourcePath} must not be a symlink.`);
  }
};

const assertContainedSourcePath = (sourcePath, lessonDir, canonicalPath) => {
  const relativePath = relative(lessonDir, canonicalPath);
  const escapes = relativePath === "" || relativePath.startsWith("..") || relativePath.includes("../");
  if (escapes) {
    throw new Error(`${sourcePath} escapes its lesson directory.`);
  }
};

export const readSourceText = async (lessonJsonPath, sourcePath) => {
  assertSafeSourcePath(sourcePath);
  const lessonDir = await realpath(dirname(lessonJsonPath));
  const absolutePath = join(lessonDir, sourcePath);
  const metadata = await lstat(absolutePath);
  assertNotSymlink(sourcePath, metadata);
  const canonicalPath = await realpath(absolutePath);
  assertContainedSourcePath(sourcePath, lessonDir, canonicalPath);
  return readFile(canonicalPath, "utf8");
};

export const isCompileFailValidation = (validation) =>
  validation?.mode === "backend-compile-fail" &&
  Array.isArray(validation.cases);

export const inlineCompileFailValidation = async (lessonJsonPath, validation) => ({
  ...validation,
  cases: await Promise.all(
    validation.cases.map(async (compileFailCase) => {
      const { sourcePath, ...runtimeCase } = compileFailCase;

      return {
        ...runtimeCase,
        path: sourcePath,
        content: await readSourceText(lessonJsonPath, sourcePath),
      };
    }),
  ),
});
