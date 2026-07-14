import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import assert from "node:assert/strict";

export const assertIncludes = (values, expected, label) => {
  assert(
    values.some((value) => value.includes(expected)),
    `${label} missing ${JSON.stringify(expected)} in ${JSON.stringify(values)}`,
  );
};

export const writeText = async (root, relativePath, content) => {
  const path = join(root, relativePath);

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
};

export const withTempRoot = async (prefix, callback) => {
  const root = await mkdtemp(join(tmpdir(), prefix));

  try {
    await callback(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
};
