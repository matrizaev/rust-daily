import type {
  IsoTimestamp,
  NonNegativeInteger,
  ProgressConceptId,
  ProgressLessonId,
} from "../types/progress";

export const nowIso = (now = new Date()) => now.toISOString() as IsoTimestamp;
export const progressLessonId = (value: string) => value as ProgressLessonId;
export const progressConceptId = (value: string) => value as ProgressConceptId;
export const nonNegativeInteger = (value: number) => value as NonNegativeInteger;
