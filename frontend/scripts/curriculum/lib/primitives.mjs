export const isRecord = (value) => typeof value === "object" && value !== null;
export const isString = (value) => typeof value === "string" && value.trim().length > 0;
export const isNumber = (value) => typeof value === "number" && Number.isFinite(value);

export const normalizeSource = (source) =>
  source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\n$/, "");
