export type StructuralCheck =
  | {
      type: "enum_unit_variants";
      enumName: string;
      requiredVariants: string[];
    }
  | {
      type: "struct_fields";
      structName: string;
      requiredFields: Array<{
        name: string;
        typeIncludes: string[];
      }>;
    }
  | {
      type: "impl_trait_for_type";
      traitName: string;
      typeName: string;
    }
  | {
      type: "impl_method";
      implFor: string;
      methodName: string;
      requiredSignatureIncludes: string[];
    }
  | {
      type: "function_signature";
      functionName: string;
      requiredSignatureIncludes: string[];
    }
  | {
      type: "source_includes";
      requiredSnippets: string[];
      forbiddenSnippets?: string[];
    };

export type LessonValidationStep =
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
      mode: "backend-cargo-test";
      timeoutMs: number;
      testCode?: string;
      dependencySet?: string;
      testFiles?: Array<{
        path: string;
        content: string;
      }>;
    }
  | {
      mode: "self-check";
    };

export type LessonValidation =
  | LessonValidationStep
  | {
      mode: "all";
      validations: LessonValidationStep[];
    };

export type ValidationStatus =
  | "passed"
  | "self_check"
  | "failed"
  | "compile_error"
  | "timeout"
  | "unsupported"
  | "internal_error";

export type ValidationRequest = {
  lessonId: string;
  validation: LessonValidation;
  files: Record<string, string>;
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
