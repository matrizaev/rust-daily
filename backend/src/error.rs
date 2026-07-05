use actix_web::{HttpResponse, ResponseError, body::BoxBody, http::StatusCode};
use serde::Serialize;
use serde_json::{Value, json};
use thiserror::Error;

use crate::{model::ValidationError, queue::EnqueueError, service::RunServiceError};

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
    #[error("run queue is unavailable")]
    QueueClosed,
    #[error("run worker dropped the result channel")]
    WorkerDropped,
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
            Self::QueueClosed | Self::WorkerDropped => StatusCode::INTERNAL_SERVER_ERROR,
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
            Self::QueueClosed => "queue_closed",
            Self::WorkerDropped => "worker_dropped",
        }
    }

    fn details(&self) -> Option<Value> {
        match self {
            Self::Validation(error) => Some(validation_details(error)),
            Self::InvalidJson { source } => Some(json!({ "reason": source.to_string() })),
            Self::JsonPayloadTooLarge
            | Self::QueueFull
            | Self::QueueClosed
            | Self::WorkerDropped => None,
        }
    }
}

impl From<EnqueueError> for ApiError {
    fn from(error: EnqueueError) -> Self {
        match error {
            EnqueueError::Full => Self::QueueFull,
            EnqueueError::Closed => Self::QueueClosed,
        }
    }
}

impl From<RunServiceError> for ApiError {
    fn from(error: RunServiceError) -> Self {
        match error {
            RunServiceError::Validation(error) => Self::Validation(error),
            RunServiceError::Enqueue(error) => error.into(),
            RunServiceError::WorkerDropped => Self::WorkerDropped,
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
    }
}

fn validation_details(error: &ValidationError) -> Value {
    match error {
        ValidationError::EmptyFiles => json!({}),
        ValidationError::TooManyFiles { max } => json!({ "max": max }),
        ValidationError::FileTooLarge { path, max_bytes } => {
            json!({ "path": path.as_str(), "max_bytes": max_bytes })
        }
        ValidationError::TotalTooLarge { max_bytes } => json!({ "max_bytes": max_bytes }),
        ValidationError::UnsafePath { path } | ValidationError::UnsupportedPath { path } => {
            json!({ "path": path })
        }
        ValidationError::DuplicatePath { path } | ValidationError::MissingRequiredFile { path } => {
            json!({ "path": path.as_str() })
        }
    }
}
