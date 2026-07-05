use actix_web::{
    error::JsonPayloadError,
    http::{Method, header},
    web,
};
use serde::Serialize;

use crate::{
    error::ApiError,
    model::{RunRequest, RunResult},
    service::AppService,
};

#[derive(Debug, Serialize)]
pub struct HealthResponse {
    status: &'static str,
}

pub fn configure(config: &mut web::ServiceConfig) {
    config
        .route("/healthz", web::get().to(healthz))
        .route("/run", web::post().to(run));
}

pub async fn healthz() -> web::Json<HealthResponse> {
    web::Json(HealthResponse { status: "ok" })
}

pub async fn run(
    service: web::Data<AppService>,
    request: web::Json<RunRequest>,
) -> Result<web::Json<RunResult>, ApiError> {
    let result = service.run_lesson(request.into_inner()).await?;
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

#[cfg(test)]
mod tests {
    use actix_web::{App, http::StatusCode, test};

    use super::configure;

    #[actix_web::test]
    async fn configured_routes_include_healthz() {
        let app = test::init_service(App::new().configure(configure)).await;

        let response =
            test::call_service(&app, test::TestRequest::get().uri("/healthz").to_request()).await;

        assert_eq!(response.status(), StatusCode::OK);
    }
}
