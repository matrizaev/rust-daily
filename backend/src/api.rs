use actix_web::{
    error::JsonPayloadError,
    http::{Method, header},
    web,
};

use crate::{
    error::ApiError,
    model::{RunRequest, RunRequestValidation, RunResult, ValidatedRunRequest, ValidationLimits},
    queue::RunQueue,
};

#[derive(Clone)]
pub struct AppState {
    queue: RunQueue,
    validation_limits: ValidationLimits,
}

impl AppState {
    pub fn new(queue: RunQueue, validation_limits: ValidationLimits) -> Self {
        Self {
            queue,
            validation_limits,
        }
    }
}

pub async fn run(
    state: web::Data<AppState>,
    request: web::Json<RunRequest>,
) -> Result<web::Json<RunResult>, ApiError> {
    let request = request.into_inner();
    let request =
        ValidatedRunRequest::try_from(RunRequestValidation::new(request, state.validation_limits))?;

    let response_rx = state.queue.try_enqueue(request)?;
    let result = response_rx.await.map_err(|_| ApiError::WorkerDropped)?;

    Ok(web::Json(result))
}

pub fn json_config(max_json_payload_bytes: usize) -> web::JsonConfig {
    web::JsonConfig::default()
        .limit(max_json_payload_bytes)
        .error_handler(|error, _request| json_payload_error(error).into())
}

pub fn json_payload_error(error: JsonPayloadError) -> ApiError {
    match error {
        JsonPayloadError::Overflow { .. } | JsonPayloadError::OverflowKnownLength { .. } => {
            ApiError::JsonPayloadTooLarge
        }
        source => ApiError::InvalidJson { source },
    }
}

pub fn cors(origin: &str) -> actix_cors::Cors {
    actix_cors::Cors::default()
        .allowed_origin(origin)
        .allowed_methods([Method::POST])
        .allowed_headers([header::CONTENT_TYPE])
        .max_age(3600)
}
