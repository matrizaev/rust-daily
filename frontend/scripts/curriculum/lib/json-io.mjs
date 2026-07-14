import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const formatJson = (value) => `${JSON.stringify(value, null, 2)}\n`;

export const writeJsonFile = async (path, value) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, formatJson(value));
};

export const pathExists = async (path) => {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
};
