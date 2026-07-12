use actix_web::{HttpResponse, ResponseError, body::BoxBody, http::StatusCode};
use serde::Serialize;
use serde_json::{Value, json};
use thiserror::Error;
use uuid::Uuid;

use crate::{
    model::ValidationError,
    service::{DispatchError, RunServiceError},
};

#[derive(Debug, Error)]
pub enum ApiError {
    #[error(transparent)]
    Validation(#[from] ValidationError),
    #[error("request JSON body exceeds configured size limit")]
    JsonPayloadTooLarge,
    #[error("invalid JSON request body: {source}")]
    InvalidJson {
        #[source]
        source: actix_web::error::JsonPayloadError,
    },
    #[error("too many run requests are queued")]
    QueueFull,
    #[error("service temporarily unavailable")]
    ServiceUnavailable { correlation_id: Uuid },
}

#[derive(Debug, Serialize)]
struct ErrorResponse {
    code: &'static str,
    error: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    details: Option<Value>,
}

impl ResponseError for ApiError {
    fn status_code(&self) -> StatusCode {
        match self {
            Self::Validation(error) if error.is_payload_limit() => StatusCode::PAYLOAD_TOO_LARGE,
            Self::Validation(_) | Self::InvalidJson { .. } => StatusCode::BAD_REQUEST,
            Self::JsonPayloadTooLarge => StatusCode::PAYLOAD_TOO_LARGE,
            Self::QueueFull => StatusCode::TOO_MANY_REQUESTS,
            Self::ServiceUnavailable { .. } => StatusCode::SERVICE_UNAVAILABLE,
        }
    }

    fn error_response(&self) -> HttpResponse<BoxBody> {
        HttpResponse::build(self.status_code()).json(ErrorResponse {
            code: self.code(),
            error: self.to_string(),
            details: self.details(),
        })
    }
}

impl ApiError {
    fn code(&self) -> &'static str {
        match self {
            Self::Validation(error) => validation_code(error),
            Self::JsonPayloadTooLarge => "json_payload_too_large",
            Self::InvalidJson { .. } => "invalid_json",
            Self::QueueFull => "queue_full",
            Self::ServiceUnavailable { .. } => "service_unavailable",
        }
    }

    fn details(&self) -> Option<Value> {
        match self {
            Self::Validation(error) => Some(validation_details(error)),
            Self::InvalidJson { source } => Some(json!({ "reason": source.to_string() })),
            Self::JsonPayloadTooLarge | Self::QueueFull => None,
            Self::ServiceUnavailable { correlation_id } => {
                Some(json!({ "correlation_id": correlation_id.to_string() }))
            }
        }
    }
}

impl From<DispatchError> for ApiError {
    fn from(error: DispatchError) -> Self {
        match error {
            DispatchError::AtCapacity => Self::QueueFull,
            DispatchError::ServiceFailure(failure) => Self::ServiceUnavailable {
                correlation_id: failure.correlation_id(),
            },
        }
    }
}

impl From<RunServiceError> for ApiError {
    fn from(error: RunServiceError) -> Self {
        match error {
            RunServiceError::Validation(error) => Self::Validation(error),
            RunServiceError::Dispatch(error) => error.into(),
        }
    }
}

fn validation_code(error: &ValidationError) -> &'static str {
    match error {
        ValidationError::EmptyFiles => "empty_files",
        ValidationError::TooManyFiles { .. } => "too_many_files",
        ValidationError::FileTooLarge { .. } => "file_too_large",
        ValidationError::TotalTooLarge { .. } => "total_too_large",
        ValidationError::UnsafePath { .. } => "unsafe_path",
        ValidationError::UnsupportedPath { .. } => "unsupported_path",
        ValidationError::DuplicatePath { .. } => "duplicate_path",
        ValidationError::MissingRequiredFile { .. } => "missing_required_file",
        ValidationError::CompileFailCasesNotAllowed => "compile_fail_cases_not_allowed",
        ValidationError::MissingCompileFailCases => "missing_compile_fail_cases",
        ValidationError::TooManyCompileFailCases { .. } => "too_many_compile_fail_cases",
        ValidationError::InvalidCompileFailCaseName { .. } => "invalid_compile_fail_case_name",
        ValidationError::DuplicateCompileFailCaseName { .. } => "duplicate_compile_fail_case_name",
        ValidationError::DuplicateCompileFailCasePath { .. } => "duplicate_compile_fail_case_path",
        ValidationError::MissingExpectedDiagnostics { .. } => "missing_expected_diagnostics",
        ValidationError::EmptyDiagnosticSnippet { .. } => "empty_diagnostic_snippet",
        ValidationError::TooManyDiagnosticSnippets { .. } => "too_many_diagnostic_snippets",
        ValidationError::DiagnosticSnippetTooLarge { .. } => "diagnostic_snippet_too_large",
        ValidationError::DiagnosticsTooLarge { .. } => "diagnostics_too_large",
        ValidationError::DuplicateDiagnosticSnippet { .. } => "duplicate_diagnostic_snippet",
        ValidationError::ConflictingDiagnosticSnippet { .. } => "conflicting_diagnostic_snippet",
    }
}

fn validation_details(error: &ValidationError) -> Value {
    match error {
        ValidationError::EmptyFiles => json!({}),
        ValidationError::TooManyFiles { max } => json!({ "max": max }),
        ValidationError::FileTooLarge { path, max_bytes } => {
            json!({ "path": path, "max_bytes": max_bytes })
        }
        ValidationError::TotalTooLarge { max_bytes } => json!({ "max_bytes": max_bytes }),
        ValidationError::UnsafePath { path } | ValidationError::UnsupportedPath { path } => {
            json!({ "path": path })
        }
        ValidationError::DuplicatePath { path } => json!({ "path": path.as_str() }),
        ValidationError::MissingRequiredFile { path } => json!({ "path": path }),
        ValidationError::CompileFailCasesNotAllowed | ValidationError::MissingCompileFailCases => {
            json!({})
        }
        ValidationError::TooManyCompileFailCases { max } => json!({ "max": max }),
        ValidationError::InvalidCompileFailCaseName { name }
        | ValidationError::DuplicateCompileFailCaseName { name }
        | ValidationError::MissingExpectedDiagnostics { name }
        | ValidationError::EmptyDiagnosticSnippet { name } => json!({ "name": name }),
        ValidationError::DuplicateCompileFailCasePath { path } => json!({ "path": path }),
        ValidationError::TooManyDiagnosticSnippets { name, max } => {
            json!({ "name": name, "max": max })
        }
        ValidationError::DiagnosticSnippetTooLarge { name, max_bytes } => {
            json!({ "name": name, "max_bytes": max_bytes })
        }
        ValidationError::DiagnosticsTooLarge { max_bytes } => {
            json!({ "max_bytes": max_bytes })
        }
        ValidationError::DuplicateDiagnosticSnippet { name, snippet }
        | ValidationError::ConflictingDiagnosticSnippet { name, snippet } => {
            json!({ "name": name, "snippet": snippet })
        }
    }
}

#[cfg(test)]
mod tests {
    use actix_web::{ResponseError, body::to_bytes, http::StatusCode};
    use serde_json::Value;
    use uuid::Uuid;

    use crate::{
        model::{SubmittedPath, ValidationError},
        service::{DispatchError, RunServiceError},
    };

    use super::ApiError;

    #[actix_web::test]
    async fn error_response_serializes_codes_and_details() {
        let response =
            ApiError::Validation(ValidationError::TooManyFiles { max: 8 }).error_response();

        assert_eq!(response.status(), StatusCode::PAYLOAD_TOO_LARGE);

        let body = to_bytes(response.into_body())
            .await
            .expect("error body should serialize");
        let payload: Value = serde_json::from_slice(&body).expect("body should be json");

        assert_eq!(payload["code"], "too_many_files");
        assert_eq!(payload["details"], serde_json::json!({ "max": 8 }));
    }

    #[test]
    fn validation_errors_map_to_stable_codes_and_statuses() {
        let duplicate_path = SubmittedPath::try_from("src/lib.rs").expect("valid path");
        let cases = [
            (
                ValidationError::EmptyFiles,
                StatusCode::BAD_REQUEST,
                "empty_files",
                serde_json::json!({}),
            ),
            (
                ValidationError::TooManyFiles { max: 8 },
                StatusCode::PAYLOAD_TOO_LARGE,
                "too_many_files",
                serde_json::json!({ "max": 8 }),
            ),
            (
                ValidationError::FileTooLarge {
                    path: "src/lib.rs".to_string(),
                    max_bytes: 100,
                },
                StatusCode::PAYLOAD_TOO_LARGE,
                "file_too_large",
                serde_json::json!({ "path": "src/lib.rs", "max_bytes": 100 }),
            ),
            (
                ValidationError::TotalTooLarge { max_bytes: 200 },
                StatusCode::PAYLOAD_TOO_LARGE,
                "total_too_large",
                serde_json::json!({ "max_bytes": 200 }),
            ),
            (
                ValidationError::UnsafePath {
                    path: "../src/lib.rs".to_string(),
                },
                StatusCode::BAD_REQUEST,
                "unsafe_path",
                serde_json::json!({ "path": "../src/lib.rs" }),
            ),
            (
                ValidationError::UnsupportedPath {
                    path: "README.md".to_string(),
                },
                StatusCode::BAD_REQUEST,
                "unsupported_path",
                serde_json::json!({ "path": "README.md" }),
            ),
            (
                ValidationError::DuplicatePath {
                    path: duplicate_path,
                },
                StatusCode::BAD_REQUEST,
                "duplicate_path",
                serde_json::json!({ "path": "src/lib.rs" }),
            ),
            (
                ValidationError::MissingRequiredFile { path: "src/lib.rs" },
                StatusCode::BAD_REQUEST,
                "missing_required_file",
                serde_json::json!({ "path": "src/lib.rs" }),
            ),
            (
                ValidationError::CompileFailCasesNotAllowed,
                StatusCode::BAD_REQUEST,
                "compile_fail_cases_not_allowed",
                serde_json::json!({}),
            ),
            (
                ValidationError::MissingCompileFailCases,
                StatusCode::BAD_REQUEST,
                "missing_compile_fail_cases",
                serde_json::json!({}),
            ),
            (
                ValidationError::TooManyCompileFailCases { max: 4 },
                StatusCode::PAYLOAD_TOO_LARGE,
                "too_many_compile_fail_cases",
                serde_json::json!({ "max": 4 }),
            ),
            (
                ValidationError::InvalidCompileFailCaseName {
                    name: "bad/name".to_string(),
                },
                StatusCode::BAD_REQUEST,
                "invalid_compile_fail_case_name",
                serde_json::json!({ "name": "bad/name" }),
            ),
            (
                ValidationError::DuplicateCompileFailCaseName {
                    name: "case".to_string(),
                },
                StatusCode::BAD_REQUEST,
                "duplicate_compile_fail_case_name",
                serde_json::json!({ "name": "case" }),
            ),
            (
                ValidationError::DuplicateCompileFailCasePath {
                    path: "compile_fail/case.rs".to_string(),
                },
                StatusCode::BAD_REQUEST,
                "duplicate_compile_fail_case_path",
                serde_json::json!({ "path": "compile_fail/case.rs" }),
            ),
            (
                ValidationError::MissingExpectedDiagnostics {
                    name: "case".to_string(),
                },
                StatusCode::BAD_REQUEST,
                "missing_expected_diagnostics",
                serde_json::json!({ "name": "case" }),
            ),
            (
                ValidationError::EmptyDiagnosticSnippet {
                    name: "case".to_string(),
                },
                StatusCode::BAD_REQUEST,
                "empty_diagnostic_snippet",
                serde_json::json!({ "name": "case" }),
            ),
        ];

        for (error, status, code, details) in cases {
            let api_error = ApiError::Validation(error);

            assert_eq!(api_error.status_code(), status);
            assert_eq!(api_error.code(), code);
            assert_eq!(api_error.details(), Some(details));
        }
    }

    #[test]
    fn dispatch_errors_map_to_status_codes_and_preserve_correlation_ids() {
        let correlation_id = Uuid::new_v4();
        let cases = [
            (
                ApiError::JsonPayloadTooLarge,
                StatusCode::PAYLOAD_TOO_LARGE,
                None,
            ),
            (
                ApiError::from(DispatchError::AtCapacity),
                StatusCode::TOO_MANY_REQUESTS,
                None,
            ),
            (
                ApiError::from(DispatchError::ServiceFailure(
                    crate::model::ServiceFailure::new(correlation_id),
                )),
                StatusCode::SERVICE_UNAVAILABLE,
                Some(correlation_id),
            ),
        ];

        for (error, status, expected_correlation_id) in cases {
            assert_eq!(error.status_code(), status);
            assert_eq!(
                error
                    .details()
                    .and_then(|details| details.get("correlation_id").cloned()),
                expected_correlation_id.map(|id| serde_json::json!(id.to_string()))
            );
        }
    }

    #[test]
    fn run_service_errors_convert_to_api_errors() {
        let validation = RunServiceError::Validation(ValidationError::EmptyFiles);
        let queue = RunServiceError::Dispatch(DispatchError::AtCapacity);

        assert!(matches!(
            ApiError::from(validation),
            ApiError::Validation(_)
        ));
        assert!(matches!(ApiError::from(queue), ApiError::QueueFull));
    }
}
