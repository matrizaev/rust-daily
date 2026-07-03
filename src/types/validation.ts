export type StructuralCheck = {
  type: "enum_unit_variants";
  enumName: string;
  requiredVariants: string[];
};

export type LessonValidation =
  | {
      mode: "structural";
      timeoutMs: number;
      checks: StructuralCheck[];
    }
  | {
      mode: "browser-rust";
      timeoutMs: number;
      checks: unknown[];
    }
  | {
      mode: "self-check";
    };

export type ValidationStatus =
  | "passed"
  | "failed"
  | "timeout"
  | "unsupported"
  | "internal_error";

export type ValidationRequest = {
  lessonId: string;
  validation: LessonValidation;
  files: {
    "src/lib.rs": string;
  };
};

export type ValidationFailure = {
  name: string;
  message: string;
};

export type ValidationResult = {
  status: ValidationStatus;
  durationMs: number;
  summary: string;
  diagnostics: string;
  failures: ValidationFailure[];
};
