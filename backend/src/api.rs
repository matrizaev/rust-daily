//! HTTP boundary for validation requests.
//!
//! Handlers in this module keep Actix-specific extraction and response shaping
//! separate from validation, queueing, and runner orchestration.

use actix_web::{
    error::JsonPayloadError,
    http::{Method, header},
    web,
};
use serde::Serialize;

use crate::{
    error::ApiError,
    model::{LearnerOutcome, RunRequest},
    service::AppService,
};

/// Lightweight health-check response.
#[derive(Debug, Serialize)]
pub struct HealthResponse {
    status: &'static str,
}

/// Registers the backend API routes.
pub fn configure(config: &mut web::ServiceConfig) {
    config
        .route("/healthz", web::get().to(healthz))
        .route("/run", web::post().to(run));
}

/// Reports process health for local and deployment checks.
pub async fn healthz() -> web::Json<HealthResponse> {
    web::Json(HealthResponse { status: "ok" })
}

/// Validates and runs a submitted lesson snapshot.
pub async fn run(
    service: web::Data<AppService>,
    request: web::Json<RunRequest>,
) -> Result<web::Json<LearnerOutcome>, ApiError> {
    let result = service.run_lesson(request.into_inner()).await?;
    Ok(web::Json(result))
}

/// Builds the JSON extractor configuration used by `/run`.
pub fn json_config(max_json_payload_bytes: usize) -> web::JsonConfig {
    web::JsonConfig::default()
        .limit(max_json_payload_bytes)
        .error_handler(|error, _request| json_payload_error(error).into())
}

/// Converts Actix JSON extraction failures into stable API errors.
pub fn json_payload_error(error: JsonPayloadError) -> ApiError {
    match error {
        JsonPayloadError::Overflow { .. } | JsonPayloadError::OverflowKnownLength { .. } => {
            ApiError::JsonPayloadTooLarge
        }
        source => ApiError::InvalidJson { source },
    }
}

/// Builds the single-origin CORS policy for browser `/run` requests.
pub fn cors(origin: &str) -> actix_cors::Cors {
    actix_cors::Cors::default()
        .allowed_origin(origin)
        .allowed_methods([Method::POST])
        .allowed_headers([header::CONTENT_TYPE])
        .max_age(3600)
        .block_on_origin_mismatch(true)
}

#[cfg(test)]
mod tests {
    use actix_web::{
        App, HttpResponse,
        http::{StatusCode, header},
        test, web,
    };

    use super::{configure, cors};

    #[actix_web::test]
    async fn configured_routes_include_healthz() {
        let app = test::init_service(App::new().configure(configure)).await;

        let response =
            test::call_service(&app, test::TestRequest::get().uri("/healthz").to_request()).await;

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[actix_web::test]
    async fn cors_rejects_mismatched_origin() {
        let app = test::init_service(
            App::new()
                .wrap(cors("https://borrowquest.qzz.io"))
                .route("/run", web::post().to(HttpResponse::Ok)),
        )
        .await;
        let request = test::TestRequest::post()
            .uri("/run")
            .insert_header((header::ORIGIN, "https://evil.example"))
            .to_request();

        let response = test::call_service(&app, request).await;

        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
    }

    #[actix_web::test]
    async fn cors_allows_configured_origin() {
        let app = test::init_service(
            App::new()
                .wrap(cors("https://borrowquest.qzz.io"))
                .route("/run", web::post().to(HttpResponse::Ok)),
        )
        .await;
        let request = test::TestRequest::post()
            .uri("/run")
            .insert_header((header::ORIGIN, "https://borrowquest.qzz.io"))
            .to_request();

        let response = test::call_service(&app, request).await;

        assert_eq!(response.status(), StatusCode::OK);
    }
}
