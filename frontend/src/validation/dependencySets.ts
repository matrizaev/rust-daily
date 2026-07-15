import type {
  DependencySet,
  LessonValidation,
  LessonValidationStep,
} from "../types/validation";

type DependencySetDetails = {
  id: DependencySet;
  name: string;
  summary: string;
  availableCrates: string[];
};

export const DEPENDENCY_SET_DETAILS = {
  std: {
    id: "std",
    name: "Standard library",
    summary: "Standard library only. External crates are not available.",
    availableCrates: [],
  },
  advanced: {
    id: "advanced",
    name: "Advanced crates",
    summary: "Standard library plus these cached external crates.",
    availableCrates: [
      "serde",
      "serde_json",
      "thiserror",
      "anyhow",
      "tokio",
      "tracing",
      "tracing-subscriber",
      "actix-web",
      "actix-rt",
      "http",
      "proptest",
    ],
  },
} satisfies Record<DependencySet, DependencySetDetails>;

const validationSteps = (validation?: LessonValidation): LessonValidationStep[] => {
  if (!validation) {
    return [];
  }

  return validation.mode === "all" ? validation.validations : [validation];
};

const isBackendValidationStep = (
  validation: LessonValidationStep,
): validation is Extract<
  LessonValidationStep,
  { mode: "backend-cargo-test" | "backend-compile-fail" }
> =>
  validation.mode === "backend-cargo-test" ||
  validation.mode === "backend-compile-fail";

export const dependencySetForValidation = (
  validation?: LessonValidation,
): DependencySet =>
  validationSteps(validation).find(isBackendValidationStep)?.dependencySet ?? "std";

export const dependencySetDetailsForValidation = (
  validation?: LessonValidation,
) => DEPENDENCY_SET_DETAILS[dependencySetForValidation(validation)];
