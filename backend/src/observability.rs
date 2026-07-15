//! Tracing, Prometheus metrics, and operational HTTP helpers.

use std::{
    sync::OnceLock,
    thread,
    time::{Duration, Instant},
};

use actix_web::{
    Error, HttpRequest, HttpResponse,
    body::MessageBody,
    dev::{ServiceRequest, ServiceResponse},
    http::header,
    middleware::Next,
};
use metrics::{counter, gauge, histogram};
use metrics_exporter_prometheus::{PrometheusBuilder, PrometheusHandle};
use tracing::warn;
use tracing_subscriber::EnvFilter;

use crate::{config::ObservabilitySettings, model::RunStatus, queue::QueueSummary};

static PROMETHEUS_HANDLE: OnceLock<Option<PrometheusHandle>> = OnceLock::new();

/// Initializes JSON tracing using `RUST_LOG` when it is present.
pub fn init_tracing() {
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("rust_daily_backend=info,actix_web=info"));

    let _ = tracing_subscriber::fmt()
        .with_env_filter(env_filter)
        .json()
        .try_init();
}

/// Initializes the Prometheus metrics recorder once for this process.
pub fn init_metrics() -> Option<PrometheusHandle> {
    PROMETHEUS_HANDLE
        .get_or_init(|| {
            let handle = PrometheusBuilder::new().install_recorder().ok()?;
            spawn_metrics_upkeep(handle.clone());
            Some(handle)
        })
        .clone()
}

fn spawn_metrics_upkeep(handle: PrometheusHandle) {
    if let Err(error) = thread::Builder::new()
        .name("rust-daily-metrics-upkeep".to_string())
        .spawn(move || {
            loop {
                thread::sleep(Duration::from_secs(5));
                handle.run_upkeep();
            }
        })
    {
        warn!(error = %error, "failed to spawn Prometheus metrics upkeep thread");
    }
}

/// Records aggregate HTTP request metrics for the wrapped Actix service.
///
/// The path label uses Actix route patterns where available and coarse buckets
/// for static or unmatched routes to avoid high-cardinality request labels.
pub(crate) async fn record_http_metrics(
    request: ServiceRequest,
    next: Next<impl MessageBody>,
) -> Result<ServiceResponse<impl MessageBody>, Error> {
    let method = request.method().as_str().to_owned();
    let path = path_label(&request);
    let started = Instant::now();
    let response = next.call(request).await?;
    let status_code = response.status().as_u16().to_string();
    let status_class = status_class(response.status().as_u16());
    let elapsed = started.elapsed().as_secs_f64();

    counter!(
        "rust_daily_http_requests_total",
        "method" => method.clone(),
        "path" => path.clone(),
        "status_code" => status_code.clone(),
        "status_class" => status_class
    )
    .increment(1);
    histogram!(
        "rust_daily_http_request_duration_seconds",
        "method" => method,
        "path" => path,
        "status_code" => status_code,
        "status_class" => status_class
    )
    .record(elapsed);

    Ok(response)
}

/// Returns the Prometheus metrics response for `GET /metrics`.
pub(crate) fn metrics_response(
    settings: &ObservabilitySettings,
    request: &HttpRequest,
    queue: QueueSummary,
) -> HttpResponse {
    if !settings.metrics_enabled {
        return HttpResponse::NotFound().finish();
    }
    if !metrics_authorized(settings, request) {
        return HttpResponse::Unauthorized().finish();
    }

    record_queue_metrics(queue);
    let body = init_metrics().map_or_else(
        || "# metrics recorder unavailable\n".to_owned(),
        |handle| handle.render(),
    );

    HttpResponse::Ok()
        .insert_header((header::CONTENT_TYPE, "text/plain; version=0.0.4"))
        .body(body)
}

/// Records a completed runner job and its learner-visible outcome.
pub(crate) fn record_runner_job_completed(status: RunStatus, duration_ms: u64) {
    let status = run_status_label(status);
    counter!("rust_daily_runner_jobs_completed_total", "status" => status).increment(1);
    histogram!("rust_daily_runner_job_duration_seconds", "status" => status)
        .record(std::time::Duration::from_millis(duration_ms).as_secs_f64());
}

#[allow(clippy::cast_precision_loss)]
fn record_queue_metrics(queue: QueueSummary) {
    gauge!("rust_daily_runner_queue_capacity").set(queue.queue_capacity() as f64);
    gauge!("rust_daily_runner_queue_depth").set(queue.queued_depth() as f64);
    gauge!("rust_daily_runner_queue_available_slots").set(queue.available_slots() as f64);
    gauge!("rust_daily_runner_running_jobs").set(queue.running_jobs() as f64);
    gauge!("rust_daily_runner_workers").set(queue.workers() as f64);
    gauge!("rust_daily_runner_queue_closed").set(if queue.is_closed() { 1.0 } else { 0.0 });
}

fn metrics_authorized(settings: &ObservabilitySettings, request: &HttpRequest) -> bool {
    let Some(token) = &settings.metrics_bearer_token else {
        return true;
    };
    let Some(value) = request.headers().get(header::AUTHORIZATION) else {
        return false;
    };
    let Ok(value) = value.to_str() else {
        return false;
    };

    constant_time_eq(value, &format!("Bearer {}", token.as_str()))
}

fn constant_time_eq(left: &str, right: &str) -> bool {
    let left = left.as_bytes();
    let right = right.as_bytes();
    let mut diff = left.len() ^ right.len();

    for index in 0..left.len().max(right.len()) {
        let left = left.get(index).copied().unwrap_or(0);
        let right = right.get(index).copied().unwrap_or(0);
        diff |= usize::from(left ^ right);
    }

    diff == 0
}

fn path_label(request: &ServiceRequest) -> String {
    if let Some(pattern) = request.match_pattern() {
        return pattern;
    }

    let path = request.path();
    match path {
        "/" => "/".to_string(),
        "/favicon.svg" => "/favicon.svg".to_string(),
        "/index.html" => "/index.html".to_string(),
        "/manifest.webmanifest" => "/manifest.webmanifest".to_string(),
        "/sw.js" => "/sw.js".to_string(),
        path if path.starts_with("/assets/") => "/assets/{asset}".to_string(),
        path if path.starts_with("/icons/") => "/icons/{icon}".to_string(),
        path if path.starts_with("/content/lessons/") && path.ends_with(".json") => {
            "/content/lessons/{lesson}.json".to_string()
        }
        path if path.starts_with("/workbox-") && path.ends_with(".js") => {
            "/workbox-{hash}.js".to_string()
        }
        path if path.contains('.') => "/{static_file}".to_string(),
        _ => "/{unmatched}".to_string(),
    }
}

fn status_class(status: u16) -> &'static str {
    match status {
        200..=299 => "2xx",
        300..=399 => "3xx",
        400..=499 => "4xx",
        500..=599 => "5xx",
        _ => "other",
    }
}

fn run_status_label(status: RunStatus) -> &'static str {
    match status {
        RunStatus::Passed => "passed",
        RunStatus::Failed => "failed",
        RunStatus::CompileError => "compile_error",
        RunStatus::TimedOut => "timed_out",
    }
}

#[cfg(test)]
mod tests {
    use actix_web::{http::StatusCode, test::TestRequest};

    use super::{
        constant_time_eq, metrics_authorized, metrics_response, run_status_label, status_class,
    };
    use crate::{
        config::{MetricsBearerToken, ObservabilitySettings},
        model::RunStatus,
        queue::QueueSummary,
    };

    #[test]
    fn status_labels_are_stable() {
        assert_eq!(status_class(200), "2xx");
        assert_eq!(status_class(302), "3xx");
        assert_eq!(status_class(404), "4xx");
        assert_eq!(status_class(503), "5xx");
        assert_eq!(status_class(700), "other");

        assert_eq!(run_status_label(RunStatus::Passed), "passed");
        assert_eq!(run_status_label(RunStatus::CompileError), "compile_error");
    }

    #[test]
    fn metrics_authorization_allows_unprotected_metrics() {
        let settings = ObservabilitySettings {
            metrics_enabled: true,
            metrics_bearer_token: None,
        };
        let request = TestRequest::get().to_http_request();

        assert!(metrics_authorized(&settings, &request));
    }

    #[test]
    fn metrics_authorization_checks_bearer_token() {
        let settings = ObservabilitySettings {
            metrics_enabled: true,
            metrics_bearer_token: Some(
                MetricsBearerToken::try_from("secret".to_string()).expect("valid token"),
            ),
        };
        let missing = TestRequest::get().to_http_request();
        let invalid = TestRequest::get()
            .insert_header(("Authorization", "Bearer wrong"))
            .to_http_request();
        let valid = TestRequest::get()
            .insert_header(("Authorization", "Bearer secret"))
            .to_http_request();

        assert!(!metrics_authorized(&settings, &missing));
        assert!(!metrics_authorized(&settings, &invalid));
        assert!(metrics_authorized(&settings, &valid));
    }

    #[test]
    fn metrics_response_honors_enablement_and_authorization() {
        let queue = QueueSummary::new(20, 19, 1, 2, false);
        let disabled = ObservabilitySettings {
            metrics_enabled: false,
            metrics_bearer_token: None,
        };
        let protected = ObservabilitySettings {
            metrics_enabled: true,
            metrics_bearer_token: Some(
                MetricsBearerToken::try_from("secret".to_string()).expect("valid token"),
            ),
        };
        let request = TestRequest::get().to_http_request();

        assert_eq!(
            metrics_response(&disabled, &request, queue).status(),
            StatusCode::NOT_FOUND
        );
        assert_eq!(
            metrics_response(&protected, &request, queue).status(),
            StatusCode::UNAUTHORIZED
        );
    }

    #[test]
    fn constant_time_eq_matches_exact_bytes() {
        assert!(constant_time_eq("Bearer secret", "Bearer secret"));
        assert!(!constant_time_eq("Bearer secret", "Bearer other"));
        assert!(!constant_time_eq("Bearer secret", "Bearer secret "));
    }
}
