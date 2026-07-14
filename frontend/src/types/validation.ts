/** Fast source-shape checks run in the browser worker. */
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
      type: "tuple_struct_fields";
      structName: string;
      requiredTypes: string[];
    }
  | {
      type: "impl_trait_for_type";
      traitName: string;
      typeName: string;
    }
  | {
      type: "derived_trait_for_type";
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

/** Backend dependency set requested by a lesson validation step. */
export type DependencySet = "std" | "advanced";

/** Authored negative compile case checked by the backend runner. */
export type CompileFailCase = {
  name: string;
  path: string;
  content: string;
  expectedDiagnostics: string[];
  forbiddenDiagnostics?: string[];
};

/** One validation step configured by lesson content. */
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
      dependencySet?: DependencySet;
      testFiles?: Array<{
        path: string;
        content: string;
      }>;
    }
  | {
      mode: "backend-compile-fail";
      timeoutMs: number;
      dependencySet?: DependencySet;
      cases: CompileFailCase[];
    }
  | {
      mode: "self-check";
    };

/** Validation configuration for a lesson. */
export type LessonValidation =
  | LessonValidationStep
  | {
      mode: "all";
      validations: LessonValidationStep[];
    };

/** Normalized validation status shown in the UI. */
export type ValidationStatus =
  | "passed"
  | "self_check"
  | "failed"
  | "compile_error"
  | "timeout"
  | "unsupported"
  | "internal_error";

/** Runtime validation request built from lesson content and current files. */
export type ValidationRequest = {
  lessonId: string;
  validation: LessonValidation;
  editablePath?: string;
  files: Record<string, string>;
};

/** One user-facing validation failure. */
export type ValidationFailure = {
  name: string;
  message: string;
};

/** Normalized validation result consumed by the lesson screen. */
export type ValidationResult = {
  status: ValidationStatus;
  durationMs: number;
  summary: string;
  diagnostics: string;
  failures: ValidationFailure[];
};
