import type { StructuralCheck, ValidationFailure } from "../types/validation";

const RUST_IDENTIFIER = /^([A-Za-z_][A-Za-z0-9_]*)\s*(?:=\s*[^({]+)?$/;

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const stripRustComments = (source: string) =>
  source
    .replace(/\/\*[\s\S]*?\*\//g, (comment) =>
      comment.replace(/[^\n\r]/g, " "),
    )
    .replace(/\/\/[^\n\r]*/g, "");

const findEnumOpenBrace = (source: string, enumName: string) => {
  const enumPattern = new RegExp(`\\benum\\s+${escapeRegex(enumName)}\\s*\\{`);
  const match = enumPattern.exec(source);

  return match ? match.index + match[0].lastIndexOf("{") : -1;
};

const braceDelta = (char: string) => Number(char === "{") - Number(char === "}");

const extractBraceBody = (source: string, openBraceIndex: number) => {
  let depth = 1;

  for (let index = openBraceIndex + 1; index < source.length; index += 1) {
    depth += braceDelta(source[index]);

    if (depth === 0) {
      return source.slice(openBraceIndex + 1, index);
    }
  }

  return null;
};

const extractEnumBody = (source: string, enumName: string) => {
  const openBraceIndex = findEnumOpenBrace(source, enumName);

  return openBraceIndex < 0 ? null : extractBraceBody(source, openBraceIndex);
};

const OPEN_DEPTH_CHARS = new Set(["(", "[", "{"]);
const CLOSE_DEPTH_CHARS = new Set([")", "]", "}"]);

const updateDepth = (char: string, depth: number) => {
  if (OPEN_DEPTH_CHARS.has(char)) {
    return depth + 1;
  }

  if (CLOSE_DEPTH_CHARS.has(char)) {
    return Math.max(0, depth - 1);
  }

  return depth;
};

const splitTopLevelEntries = (body: string) => {
  const entries: string[] = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];

    if (char === "," && depth === 0) {
      entries.push(body.slice(start, index));
      start = index + 1;
    } else {
      depth = updateDepth(char, depth);
    }
  }

  entries.push(body.slice(start));
  return entries;
};

const getUnitVariantName = (entry: string) => {
  const match = RUST_IDENTIFIER.exec(entry.trim());

  return match?.[1] ?? null;
};

const isVariantName = (value: string | null): value is string =>
  value !== null;

const missingVariantFailures = (
  variants: Set<string>,
  requiredVariants: string[],
) =>
  requiredVariants
    .filter((variant) => !variants.has(variant))
    .map((variant) => ({
      name: variant,
      message: `Missing variant: ${variant}.`,
    }));

const enumNotFoundFailure = (enumName: string): ValidationFailure => ({
  name: enumName,
  message: `${enumName} enum was not found.`,
});

const emptyEnumFailure = (enumName: string): ValidationFailure => ({
  name: enumName,
  message: `${enumName} enum is empty.`,
});

const runEnumUnitVariantsCheck = (
  source: string,
  check: StructuralCheck,
): ValidationFailure[] => {
  const body = extractEnumBody(stripRustComments(source), check.enumName);

  if (body === null) {
    return [enumNotFoundFailure(check.enumName)];
  }

  const variants = new Set(
    splitTopLevelEntries(body).map(getUnitVariantName).filter(isVariantName),
  );
  const missing = missingVariantFailures(variants, check.requiredVariants);

  return variants.size === 0 ? [emptyEnumFailure(check.enumName), ...missing] : missing;
};

export const runStructuralChecks = (
  source: string,
  checks: StructuralCheck[],
) => checks.flatMap((check) => runEnumUnitVariantsCheck(source, check));
