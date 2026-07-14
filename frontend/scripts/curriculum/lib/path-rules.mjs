import { isString } from "./primitives.mjs";

export const VALID_FILE_ROLES = new Set(["editable", "readonly", "test"]);
export const REQUIRED_LIB_PATH = "src/lib.rs";
export const TEST_FILE_PATTERN = "tests/**/*.rs";
export const COMPILE_FAIL_PREFIX = "compile_fail/";

export const isTestFilePath = (path) => path.startsWith("tests/") && path.endsWith(".rs");
export const isSourceFilePath = (path) => path.startsWith("src/") && path.endsWith(".rs");
export const isFixturePath = (path) => path.startsWith("fixtures/");
export const isTestdataPath = (path) => path.startsWith("testdata/");
export const isRunnerPath = (path) =>
  [isSourceFilePath, isTestFilePath, isFixturePath, isTestdataPath].some((matches) =>
    matches(path),
  );
export const isCompileFailPath = (path) =>
  path.startsWith(COMPILE_FAIL_PREFIX) && path.endsWith(".rs");

const hasUnsafePathComponent = (path) =>
  path.split("/").some((component) => component === "" || component === "." || component === "..");

const unsafePathPredicates = [
  (path) => path.startsWith("/"),
  (path) => path.includes("\\"),
  (path) => path.includes("\0"),
  (path) => path.endsWith("/"),
  hasUnsafePathComponent,
];

const hasUnsafePathSyntax = (path) =>
  unsafePathPredicates.some((isUnsafe) => isUnsafe(path));

export const isSafeRelativePath = (path) => isString(path) && !hasUnsafePathSyntax(path);
