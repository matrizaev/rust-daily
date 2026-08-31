//! HTTP boundary for validation requests.
//!
//! Handlers in this module keep Actix-specific extraction and response shaping
//! separate from validation, queueing, and runner orchestration.

use actix_web::{
    HttpRequest, HttpResponse,
    error::JsonPayloadError,
    http::{Method, header},
    web,
};
use serde::Serialize;

use crate::{
    config::ObservabilitySettings,
    error::ApiError,
    model::{LearnerOutcome, RunRequest},
    observability::metrics_response,
    queue::{QueueSummary, RunQueue},
    service::AppService,
};

/// JSON payload returned by the lightweight `GET /healthz` check.
#[derive(Debug, Serialize)]
pub struct HealthResponse {
    status: &'static str,
}

/// JSON payload returned by `GET /readyz`, including bounded queue health.
#[derive(Debug, Serialize)]
pub struct ReadinessResponse {
    status: &'static str,
    queue: QueueHealthResponse,
}

/// Runner queue health fields safe to expose through `GET /readyz`.
#[derive(Debug, Serialize)]
pub struct QueueHealthResponse {
    capacity: usize,
    queued_depth: usize,
    available_slots: usize,
    running_jobs: usize,
    workers: usize,
    closed: bool,
}

/// Registers the health, readiness, metrics, and lesson-run API endpoints.
pub fn configure(config: &mut web::ServiceConfig) {
    config
        .route("/healthz", web::get().to(healthz))
        .route("/readyz", web::get().to(readyz))
        .route("/metrics", web::get().to(metrics))
        .route("/run", web::post().to(run));
}

/// Handles `GET /healthz` for local and deployment liveness checks.
pub async fn healthz() -> web::Json<HealthResponse> {
    web::Json(HealthResponse { status: "ok" })
}

/// Handles `GET /readyz`, returning `503` when the runner queue is closed.
pub async fn readyz(queue: web::Data<RunQueue>) -> HttpResponse {
    let queue = queue.summary();
    let response = ReadinessResponse {
        status: if queue.is_closed() {
            "unavailable"
        } else {
            "ok"
        },
        queue: QueueHealthResponse::from(queue),
    };

    if queue.is_closed() {
        HttpResponse::ServiceUnavailable().json(response)
    } else {
        HttpResponse::Ok().json(response)
    }
}

/// Handles `GET /metrics` when Prometheus metrics are enabled and authorized.
pub async fn metrics(
    settings: web::Data<ObservabilitySettings>,
    queue: web::Data<RunQueue>,
    request: HttpRequest,
) -> HttpResponse {
    metrics_response(&settings, &request, queue.summary())
}

/// Handles `POST /run` by validating and running a submitted lesson snapshot.
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

impl From<QueueSummary> for QueueHealthResponse {
    fn from(summary: QueueSummary) -> Self {
        Self {
            capacity: summary.queue_capacity(),
            queued_depth: summary.queued_depth(),
            available_slots: summary.available_slots(),
            running_jobs: summary.running_jobs(),
            workers: summary.workers(),
            closed: summary.is_closed(),
        }
    }
}

#[cfg(test)]
mod tests {
    use std::{
        num::{NonZeroU64, NonZeroUsize},
        path::PathBuf,
        sync::Arc,
        time::Duration,
    };

    use actix_web::{
        App, HttpResponse,
        http::{StatusCode, header},
        test, web,
    };
    use tokio_util::sync::CancellationToken;
    use uuid::Uuid;

    use super::{configure, cors};
    use crate::{
        config::{
            ContainerCpus, CoreUlimit, PodmanPath, RunnerImage, RunnerSettings, WorkspaceRoot,
        },
        model::{
            LearnerOutcome, RunDeadline, RunRequest, RunStatus, SubmittedFile, ValidatedRunRequest,
            ValidationLimits,
        },
        queue::{LessonRunner, OutcomePublisher, spawn_workers_with_runner},
        service::LessonRunService,
    };

    #[derive(Clone, Copy)]
    struct DeadlineRunner;

    impl LessonRunner for DeadlineRunner {
        async fn run(
            &self,
            _job_id: Uuid,
            _request: ValidatedRunRequest,
            _deadline: RunDeadline,
            cancellation: CancellationToken,
            _outcome: OutcomePublisher,
        ) {
            cancellation.cancelled().await;
        }
    }

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
                .wrap(cors("https://borrowquest.site"))
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
                .wrap(cors("https://borrowquest.site"))
                .route("/run", web::post().to(HttpResponse::Ok)),
        )
        .await;
        let request = test::TestRequest::post()
            .uri("/run")
            .insert_header((header::ORIGIN, "https://borrowquest.site"))
            .to_request();

        let response = test::call_service(&app, request).await;

        assert_eq!(response.status(), StatusCode::OK);
    }

    #[actix_web::test]
    async fn deadline_expiry_is_an_ok_timed_out_response() {
        let root = tempfile::tempdir().expect("test root should be created");
        let queue =
            spawn_workers_with_runner(runner_settings(root.path().join("runs")), DeadlineRunner);
        let service = LessonRunService::new(queue, validation_limits());
        let app = test::init_service(
            App::new()
                .app_data(web::Data::new(service))
                .configure(configure),
        )
        .await;
        let request = test::TestRequest::post()
            .uri("/run")
            .set_json(RunRequest::new(vec![
                SubmittedFile::new("src/lib.rs", "pub fn answer() -> u8 { 42 }\n"),
                SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer() {}\n"),
            ]))
            .to_request();

        let response = test::call_service(&app, request).await;

        assert_eq!(response.status(), StatusCode::OK);
        let outcome: LearnerOutcome = test::read_body_json(response).await;
        assert_eq!(outcome.status, RunStatus::TimedOut);
        assert!(outcome.duration_ms >= 5);
    }

    fn validation_limits() -> ValidationLimits {
        ValidationLimits::try_new(
            nonzero(8),
            nonzero(65536),
            nonzero(262144),
            nonzero(240),
            nonzero(120),
            nonzero(16),
            nonzero(512),
            nonzero(8192),
        )
        .expect("test validation limits should be valid")
    }

    fn runner_settings(workspace_root: PathBuf) -> Arc<RunnerSettings> {
        Arc::new(RunnerSettings {
            queue_capacity: nonzero(2),
            workers: nonzero(1),
            timeout: Duration::from_millis(5),
            cleanup_timeout: Duration::from_secs(1),
            max_output_bytes: nonzero(1024),
            max_process_output_bytes: nonzero(4096),
            workspace_tmpfs_bytes: NonZeroU64::new(1024 * 1024).expect("nonzero tmpfs"),
            container_memory_bytes: NonZeroU64::new(256 * 1024 * 1024).expect("nonzero memory"),
            container_cpus: ContainerCpus::try_from(0.5).expect("valid CPU limit"),
            container_pids_limit: NonZeroU64::new(128).expect("nonzero pids"),
            tmp_tmpfs_bytes: NonZeroU64::new(64 * 1024 * 1024).expect("nonzero tmp"),
            process_headroom_bytes: NonZeroU64::new(64 * 1024 * 1024).expect("nonzero headroom"),
            core_ulimit: CoreUlimit::try_from("0:0".to_string()).expect("valid core ulimit"),
            image: RunnerImage::try_from("rust-runner:test".to_string()).expect("valid image"),
            workspace_root: WorkspaceRoot::try_from(workspace_root).expect("valid workspace"),
            podman_path: PodmanPath::try_from(PathBuf::from("podman")).expect("valid path"),
        })
    }

    fn nonzero(value: usize) -> NonZeroUsize {
        NonZeroUsize::new(value).expect("test value should be nonzero")
    }
}
