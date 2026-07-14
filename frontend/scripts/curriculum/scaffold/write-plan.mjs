import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  pathExists,
  repoRelativePath,
  writeJsonFile,
} from "../shared.mjs";
import { PLACEHOLDER_MARKER } from "../scaffold-presets.mjs";

export const textWrite = (path, content, protectedWrite = true) => ({
  kind: "text",
  path,
  content,
  protectedWrite,
});

export const jsonWrite = (path, value) => ({
  kind: "json",
  path,
  value,
  protectedWrite: false,
});

export const copyWrite = (source, path) => ({
  kind: "copy",
  source,
  path,
  protectedWrite: true,
});

const validateUniqueWriteTarget = (paths, write, errors) => {
  if (paths.has(write.path)) {
    errors.push(`Write plan contains duplicate target ${repoRelativePath(write.path)}.`);
  }

  paths.add(write.path);
};

const shouldCheckProtectedOverwrite = async (write, force) =>
  force && write.protectedWrite && (await pathExists(write.path));

const validateProtectedOverwrite = async (write, force, errors) => {
  if (!(await shouldCheckProtectedOverwrite(write, force))) {
    return;
  }

  const current = await readFile(write.path, "utf8");

  if (!current.includes(PLACEHOLDER_MARKER)) {
    errors.push(`${repoRelativePath(write.path)} does not contain ${PLACEHOLDER_MARKER}; refusing to overwrite.`);
  }
};

export const validateWritePlan = async (writes, force) => {
  const errors = [];
  const paths = new Set();

  for (const write of writes) {
    validateUniqueWriteTarget(paths, write, errors);
    await validateProtectedOverwrite(write, force, errors);
  }

  return errors;
};

const executeWrite = async (write) => {
  await mkdir(dirname(write.path), { recursive: true });

  if (write.kind === "json") {
    await writeJsonFile(write.path, write.value);
  } else if (write.kind === "copy") {
    await copyFile(write.source, write.path);
  } else {
    await writeFile(write.path, write.content);
  }
};

export const executeWritePlan = async (writes) => {
  const regularWrites = writes.filter((write) => write.kind !== "json");
  const jsonWrites = writes.filter((write) => write.kind === "json");

  for (const write of [...regularWrites, ...jsonWrites]) {
    await executeWrite(write);
  }
};

export const printSuccess = (options, writes) => {
  const sourceWrites = writes
    .filter((write) => write.kind !== "json")
    .map((write) => `- ${repoRelativePath(write.path)}`);

  console.log("Created lesson scaffold:");
  if (options.preset) {
    console.log(`Preset: ${options.preset}`);
  }
  console.log(sourceWrites.join("\n"));
  console.log("\nNext:");
  console.log("1. Replace every TODO(author) placeholder.");
  console.log("2. scripts/curriculum/validate-source");
  console.log("3. scripts/curriculum/generate");
  console.log("4. scripts/curriculum/check-generated");
  console.log(`5. scripts/test-lesson-solutions.sh lessons/${options.arc}/${options.lesson}`);
};

export const printDryRun = (options, lessonJson, writes) => {
  const sourceWrites = writes.filter((write) => write.kind !== "json");
  const metadataWrites = writes.filter((write) => write.kind === "json");
  const copyWrites = writes.filter((write) => write.kind === "copy");

  console.log("Dry run lesson scaffold:");
  if (options.preset) {
    console.log(`Preset: ${options.preset}`);
  }
  console.log(`Lesson: ${lessonJson.id}`);
  console.log(`Arc/day/order: ${lessonJson.arcId} day ${lessonJson.day}, order ${lessonJson.order}`);
  console.log("Files to create:");
  sourceWrites.forEach((write) => console.log(`- ${repoRelativePath(write.path)}`));
  if (copyWrites.length > 0) {
    console.log("Copied continuity sources:");
    copyWrites.forEach((write) =>
      console.log(`- ${repoRelativePath(write.source)} -> ${repoRelativePath(write.path)}`));
  }
  console.log("Metadata updates:");
  metadataWrites.forEach((write) => console.log(`- ${repoRelativePath(write.path)}`));
  console.log("Validation commands:");
  console.log("- scripts/curriculum/validate-source");
  console.log("- scripts/curriculum/generate --check");
  console.log("- scripts/curriculum/check-generated");
  console.log(`- scripts/test-lesson-solutions.sh lessons/${options.arc}/${options.lesson}`);
};
