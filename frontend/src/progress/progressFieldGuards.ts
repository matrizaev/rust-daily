import type {
  IsoTimestamp,
  LocalDate,
  NonNegativeInteger,
} from "../types/progress";

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

export const isString = (value: unknown): value is string =>
  typeof value === "string";

export const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export const isNonNegativeInteger = (
  value: unknown,
): value is NonNegativeInteger =>
  isNumber(value) && Number.isInteger(value) && value >= 0;

export const isIsoDate = (value: unknown): value is IsoTimestamp =>
  isString(value) &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
  !Number.isNaN(Date.parse(value)) &&
  new Date(value).toISOString() === value;

export const isLocalDate = (value: unknown): value is LocalDate => {
  if (!isString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day;
};

export const isArrayOf = <T>(
  value: unknown,
  guard: (item: unknown) => item is T,
): value is T[] => Array.isArray(value) && value.every(guard);

export const hasStringFields = (
  value: Record<string, unknown>,
  fields: string[],
) => fields.every((field) => isString(value[field]));
