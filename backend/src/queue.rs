//! Bounded asynchronous queue for lesson runner jobs.
//!
//! The queue provides backpressure, preserves per-request deadlines across
//! queueing and execution, and cancels work when callers drop the response.

use std::{
    future::Future,
    sync::{
        Arc,
        atomic::{AtomicUsize, Ordering},
    },
};

use metrics::counter;
use thiserror::Error;
use tokio::{
    sync::{Mutex, mpsc, oneshot},
    task::JoinError,
};
use tokio_util::sync::CancellationToken;
use tracing::{info, warn};
use uuid::Uuid;

use crate::{
    config::RunnerSettings,
    model::{LearnerOutcome, RunDeadline, ServiceFailure, ValidatedRunRequest},
    observability,
    runner::PodmanLessonRunner,
    service::{DispatchError, RunDispatcher},
};

/// Execution backend used by worker tasks.
pub trait LessonRunner: Clone + Send + Sync + 'static {
    /// Runs a validated lesson request within the given deadline and cancellation scope.
    fn run(
        &self,
        job_id: Uuid,
        request: ValidatedRunRequest,
        deadline: RunDeadline,
        cancellation: CancellationToken,
    ) -> impl Future<Output = Result<LearnerOutcome, ServiceFailure>> + Send;
}

/// Cloneable handle for submitting work to the bounded runner queue.
#[derive(Clone)]
pub struct RunQueue {
    sender: mpsc::Sender<RunJob>,
    timeout: std::time::Duration,
    running_jobs: Arc<AtomicUsize>,
    workers: usize,
}

/// Point-in-time summary of the bounded runner queue.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct QueueSummary {
    queue_capacity: usize,
    available_slots: usize,
    running_jobs: usize,
    workers: usize,
    is_closed: bool,
}

impl QueueSummary {
    /// Creates a summary from observed queue values.
    pub const fn new(
        queue_capacity: usize,
        available_slots: usize,
        running_jobs: usize,
        workers: usize,
        is_closed: bool,
    ) -> Self {
        Self {
            queue_capacity,
            available_slots,
            running_jobs,
            workers,
            is_closed,
        }
    }

    /// Maximum number of jobs that can wait in the queue.
    pub const fn queue_capacity(self) -> usize {
        self.queue_capacity
    }

    /// Number of queue slots currently available.
    pub const fn available_slots(self) -> usize {
        self.available_slots
    }

    /// Number of jobs currently waiting for a worker.
    pub const fn queued_depth(self) -> usize {
        self.queue_capacity.saturating_sub(self.available_slots)
    }

    /// Number of worker tasks currently running a job.
    pub const fn running_jobs(self) -> usize {
        self.running_jobs
    }

    /// Number of configured worker tasks.
    pub const fn workers(self) -> usize {
        self.workers
    }

    /// Returns whether all queue receivers are closed.
    pub const fn is_closed(self) -> bool {
        self.is_closed
    }
}

/// Failure to enqueue a validated run request.
#[derive(Debug, Error)]
pub enum EnqueueError {
    /// The queue has reached configured capacity.
    #[error("too many run requests are queued")]
    Full,
    /// All workers or receivers are gone.
    #[error("run queue is unavailable")]
    Closed(ServiceFailure),
}

struct RunJob {
    id: Uuid,
    request: ValidatedRunRequest,
    response_tx: oneshot::Sender<Result<LearnerOutcome, ServiceFailure>>,
    deadline: RunDeadline,
}

impl RunQueue {
    /// Returns a point-in-time summary of queue capacity and worker activity.
    pub fn summary(&self) -> QueueSummary {
        QueueSummary::new(
            self.sender.max_capacity(),
            self.sender.capacity(),
            self.running_jobs.load(Ordering::Relaxed),
            self.workers,
            self.sender.is_closed(),
        )
    }

    /// Attempts to enqueue a request without waiting for capacity.
    pub fn try_enqueue(
        &self,
        request: ValidatedRunRequest,
    ) -> Result<oneshot::Receiver<Result<LearnerOutcome, ServiceFailure>>, EnqueueError> {
        self.try_enqueue_with_deadline(request, RunDeadline::after(self.timeout))
            .map(|(_, response)| response)
    }

    fn try_enqueue_with_deadline(
        &self,
        request: ValidatedRunRequest,
        deadline: RunDeadline,
    ) -> Result<
        (
            Uuid,
            oneshot::Receiver<Result<LearnerOutcome, ServiceFailure>>,
        ),
        EnqueueError,
    > {
        let (response_tx, response_rx) = oneshot::channel();
        let job = RunJob {
            id: Uuid::new_v4(),
            request,
            response_tx,
            deadline,
        };
        let job_id = job.id;

        match self.sender.try_send(job) {
            Ok(()) => {
                counter!("rust_daily_runner_jobs_enqueued_total").increment(1);
                info!(%job_id, "job accepted");
                Ok((job_id, response_rx))
            }
            Err(mpsc::error::TrySendError::Full(job)) => {
                counter!("rust_daily_runner_jobs_rejected_total", "reason" => "queue_full")
                    .increment(1);
                warn!(job_id = %job.id, "job rejected due to queue capacity");
                Err(EnqueueError::Full)
            }
            Err(mpsc::error::TrySendError::Closed(job)) => {
                counter!("rust_daily_runner_jobs_rejected_total", "reason" => "queue_closed")
                    .increment(1);
                warn!(job_id = %job.id, "job rejected because queue is closed");
                Err(EnqueueError::Closed(ServiceFailure::new(job.id)))
            }
        }
    }
}

impl RunDispatcher for RunQueue {
    async fn dispatch(
        &self,
        request: ValidatedRunRequest,
    ) -> Result<LearnerOutcome, DispatchError> {
        let deadline = RunDeadline::after(self.timeout);
        let (job_id, response) =
            self.try_enqueue_with_deadline(request, deadline)
                .map_err(|error| match error {
                    EnqueueError::Full => DispatchError::AtCapacity,
                    EnqueueError::Closed(failure) => DispatchError::ServiceFailure(failure),
                })?;

        match tokio::time::timeout(deadline.remaining(), response).await {
            Ok(Ok(result)) => result.map_err(DispatchError::ServiceFailure),
            Ok(Err(_)) => {
                counter!("rust_daily_runner_jobs_failed_total").increment(1);
                warn!(%job_id, "run worker dropped the result channel");
                Err(DispatchError::ServiceFailure(ServiceFailure::new(job_id)))
            }
            Err(_) => {
                warn!(%job_id, "job expired while waiting in queue");
                Err(DispatchError::ServiceFailure(ServiceFailure::new(job_id)))
            }
        }
    }
}

/// Spawns runner workers and returns a queue handle for dispatching jobs.
pub fn spawn_workers(config: Arc<RunnerSettings>) -> RunQueue {
    let runner = PodmanLessonRunner::new(Arc::clone(&config));
    spawn_workers_with_runner(config, runner)
}

fn spawn_workers_with_runner<R>(config: Arc<RunnerSettings>, runner: R) -> RunQueue
where
    R: LessonRunner,
{
    let (sender, receiver) = mpsc::channel(config.queue_capacity.get());
    let receiver = Arc::new(Mutex::new(receiver));
    let running_jobs = Arc::new(AtomicUsize::new(0));
    let workers = config.workers.get();

    for worker_id in 0..workers {
        tokio::spawn(worker_loop(
            worker_id,
            Arc::clone(&receiver),
            runner.clone(),
            Arc::clone(&running_jobs),
        ));
    }

    RunQueue {
        sender,
        timeout: config.timeout,
        running_jobs,
        workers,
    }
}

async fn worker_loop<R>(
    worker_id: usize,
    receiver: Arc<Mutex<mpsc::Receiver<RunJob>>>,
    runner: R,
    running_jobs: Arc<AtomicUsize>,
) where
    R: LessonRunner,
{
    loop {
        let job = {
            let mut receiver = receiver.lock().await;
            receiver.recv().await
        };

        let Some(job) = job else {
            info!(worker_id, "run queue closed; worker exiting");
            break;
        };

        let job_id = job.id;
        if job.response_tx.is_closed() {
            counter!(
                "rust_daily_runner_jobs_canceled_total",
                "reason" => "response_dropped_before_start"
            )
            .increment(1);
            warn!(%job_id, worker_id, "job skipped because result receiver was dropped");
            continue;
        }

        info!(%job_id, worker_id, "job started by worker");

        running_jobs.fetch_add(1, Ordering::Relaxed);
        run_job(job, worker_id, runner.clone()).await;
        running_jobs.fetch_sub(1, Ordering::Relaxed);
    }
}

async fn run_job<R>(mut job: RunJob, worker_id: usize, runner: R)
where
    R: LessonRunner,
{
    let job_id = job.id;
    let cancellation = CancellationToken::new();
    let runner_cancellation = cancellation.clone();
    let run_task = tokio::spawn(async move {
        runner
            .run(job_id, job.request, job.deadline, runner_cancellation)
            .await
    });
    tokio::pin!(run_task);

    tokio::select! {
        result = &mut run_task => {
            let result = match result {
                Ok(result) => result,
                Err(error) => Err(runner_task_failed(job_id, worker_id, error)),
            };
            match &result {
                Ok(outcome) => info!(
                        %job_id,
                        worker_id,
                        status = ?outcome.status,
                        duration_ms = outcome.duration_ms,
                        "job finished"
                    ),
                Err(_) => warn!(%job_id, worker_id, "job failed internally"),
            }
            let completion = result
                .as_ref()
                .ok()
                .map(|outcome| (outcome.status, outcome.duration_ms));
            let failed = result.is_err();

            if job.response_tx.send(result).is_ok() {
                if let Some((status, duration_ms)) = completion {
                    observability::record_runner_job_completed(status, duration_ms);
                } else if failed {
                    counter!("rust_daily_runner_jobs_failed_total").increment(1);
                }
            } else {
                counter!(
                    "rust_daily_runner_jobs_canceled_total",
                    "reason" => "response_dropped_before_delivery"
                )
                .increment(1);
                warn!(%job_id, worker_id, "job result receiver was dropped");
            }
        }
        () = job.response_tx.closed() => {
            counter!(
                "rust_daily_runner_jobs_canceled_total",
                "reason" => "response_dropped_while_running"
            )
            .increment(1);
            warn!(%job_id, worker_id, "job canceled because result receiver was dropped");
            cancellation.cancel();
            let _ = run_task.await;
        }
    }
}

fn runner_task_failed(job_id: Uuid, worker_id: usize, error: JoinError) -> ServiceFailure {
    warn!(%job_id, worker_id, error = %error, "runner task failed");
    ServiceFailure::new(job_id)
}

#[cfg(test)]
mod tests {
    use std::{
        num::{NonZeroU64, NonZeroUsize},
        path::PathBuf,
        sync::{
            Arc,
            atomic::{AtomicUsize, Ordering},
        },
        time::Duration,
    };

    use tokio::sync::{Notify, mpsc};
    use tokio_util::sync::CancellationToken;
    use uuid::Uuid;

    use crate::config::{
        ContainerCpus, CoreUlimit, PodmanPath, RunnerImage, RunnerSettings, WorkspaceRoot,
    };
    use crate::model::{
        LearnerOutcome, RunDeadline, RunRequest, RunRequestValidation, RunStatus, ServiceFailure,
        SubmittedFile, ValidatedRunRequest, ValidationLimits,
    };

    use super::{EnqueueError, LessonRunner, RunJob, RunQueue, spawn_workers_with_runner};
    use crate::service::RunDispatcher;

    #[derive(Clone, Copy)]
    struct ImmediateRunner;

    impl LessonRunner for ImmediateRunner {
        async fn run(
            &self,
            _job_id: Uuid,
            _request: ValidatedRunRequest,
            _deadline: RunDeadline,
            _cancellation: CancellationToken,
        ) -> Result<LearnerOutcome, ServiceFailure> {
            Ok(LearnerOutcome::new(
                RunStatus::Passed,
                "ok".to_string(),
                String::new(),
                1,
            ))
        }
    }

    #[derive(Clone)]
    struct CancellationAwareRunner {
        started: Arc<Notify>,
        cancelled: Arc<Notify>,
    }

    impl LessonRunner for CancellationAwareRunner {
        async fn run(
            &self,
            _job_id: Uuid,
            _request: ValidatedRunRequest,
            _deadline: RunDeadline,
            cancellation: CancellationToken,
        ) -> Result<LearnerOutcome, ServiceFailure> {
            self.started.notify_one();
            cancellation.cancelled().await;
            self.cancelled.notify_one();
            Err(ServiceFailure::new(Uuid::nil()))
        }
    }

    #[derive(Clone, Copy)]
    struct PanicRunner;

    impl LessonRunner for PanicRunner {
        async fn run(
            &self,
            _job_id: Uuid,
            _request: ValidatedRunRequest,
            _deadline: RunDeadline,
            _cancellation: CancellationToken,
        ) -> Result<LearnerOutcome, ServiceFailure> {
            panic!("intentional runner panic")
        }
    }

    fn validated_request() -> ValidatedRunRequest {
        ValidatedRunRequest::try_from(RunRequestValidation::new(
            RunRequest::new(vec![
                SubmittedFile::new("src/lib.rs", "pub fn answer() -> u8 { 42 }\n"),
                SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer() {}\n"),
            ]),
            validation_limits(),
        ))
        .expect("request should validate")
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
        .expect("test limits should be valid")
    }

    fn nonzero(value: usize) -> NonZeroUsize {
        NonZeroUsize::new(value).expect("test value should be non-zero")
    }

    fn test_queue(sender: mpsc::Sender<RunJob>, timeout: Duration) -> RunQueue {
        RunQueue {
            sender,
            timeout,
            running_jobs: Arc::new(AtomicUsize::new(0)),
            workers: 1,
        }
    }

    fn runner_settings(workspace_root: PathBuf) -> Arc<RunnerSettings> {
        Arc::new(RunnerSettings {
            queue_capacity: nonzero(2),
            workers: nonzero(1),
            timeout: Duration::from_secs(1),
            cleanup_timeout: Duration::from_secs(1),
            max_output_bytes: nonzero(1024),
            max_process_output_bytes: nonzero(4096),
            workspace_tmpfs_bytes: NonZeroU64::new(1024 * 1024)
                .expect("tmpfs limit should be nonzero"),
            container_memory_bytes: NonZeroU64::new(256 * 1024 * 1024)
                .expect("container memory should be nonzero"),
            container_cpus: ContainerCpus::try_from(0.5)
                .expect("container CPU limit should be valid"),
            container_pids_limit: NonZeroU64::new(128)
                .expect("container pids limit should be nonzero"),
            tmp_tmpfs_bytes: NonZeroU64::new(64 * 1024 * 1024)
                .expect("tmp tmpfs limit should be nonzero"),
            process_headroom_bytes: NonZeroU64::new(64 * 1024 * 1024)
                .expect("process headroom should be nonzero"),
            core_ulimit: CoreUlimit::try_from("0:0".to_string())
                .expect("core ulimit should be valid"),
            image: RunnerImage::try_from("rust-runner:test".to_string())
                .expect("test image should be valid"),
            workspace_root: WorkspaceRoot::try_from(workspace_root)
                .expect("test workspace should be valid"),
            podman_path: PodmanPath::try_from(PathBuf::from("podman"))
                .expect("test Podman path should be valid"),
        })
    }

    #[tokio::test]
    async fn try_enqueue_accepts_jobs_until_capacity() {
        let (sender, mut receiver) = mpsc::channel(1);
        let queue = test_queue(sender, Duration::from_secs(10));

        let response = queue
            .try_enqueue(validated_request())
            .expect("first enqueue should fit");
        let job = receiver.recv().await.expect("job should be queued");

        assert!(!job.id.is_nil());
        assert!(!job.response_tx.is_closed());
        drop(response);
    }

    #[tokio::test]
    async fn try_enqueue_reports_full_queue() {
        let (sender, _receiver) = mpsc::channel(1);
        let queue = test_queue(sender, Duration::from_secs(10));
        let _first = queue
            .try_enqueue(validated_request())
            .expect("first enqueue should fit");

        let error = queue
            .try_enqueue(validated_request())
            .expect_err("second enqueue should be full");

        assert!(matches!(error, EnqueueError::Full));
    }

    #[tokio::test]
    async fn try_enqueue_reports_closed_queue() {
        let (sender, receiver) = mpsc::channel(1);
        drop(receiver);
        let queue = test_queue(sender, Duration::from_secs(10));

        let error = queue
            .try_enqueue(validated_request())
            .expect_err("closed channel should reject enqueue");

        let EnqueueError::Closed(failure) = error else {
            panic!("closed queue should preserve its correlation ID");
        };
        assert!(!failure.correlation_id().is_nil());
    }

    #[tokio::test]
    async fn dispatch_completes_expired_queued_job_without_worker() {
        let (sender, mut receiver) = mpsc::channel(1);
        let queue = test_queue(sender, Duration::from_millis(10));

        let result = queue.dispatch(validated_request()).await;
        let job = receiver.recv().await.expect("job should remain queued");

        assert!(matches!(
            result,
            Err(crate::service::DispatchError::ServiceFailure(_))
        ));
        assert!(job.response_tx.is_closed());
    }

    #[tokio::test]
    async fn summary_reports_queue_depth_and_running_jobs() {
        let (sender, _receiver) = mpsc::channel(2);
        let queue = test_queue(sender, Duration::from_secs(10));
        queue.running_jobs.store(1, Ordering::Relaxed);
        let _first = queue
            .try_enqueue(validated_request())
            .expect("first enqueue should fit");

        let summary = queue.summary();

        assert_eq!(summary.queue_capacity(), 2);
        assert_eq!(summary.available_slots(), 1);
        assert_eq!(summary.queued_depth(), 1);
        assert_eq!(summary.running_jobs(), 1);
        assert_eq!(summary.workers(), 1);
        assert!(!summary.is_closed());
    }

    #[tokio::test]
    async fn worker_pool_dispatches_with_injected_runner() {
        let root = tempfile::tempdir().expect("test root should be created");
        let queue =
            spawn_workers_with_runner(runner_settings(root.path().join("runs")), ImmediateRunner);

        let result = queue
            .dispatch(validated_request())
            .await
            .expect("worker should return result");

        assert_eq!(result.status, RunStatus::Passed);
        assert_eq!(result.stdout, "ok");
        drop(queue);
        tokio::task::yield_now().await;
    }

    #[tokio::test]
    async fn dropped_dispatch_cancels_injected_runner() {
        let root = tempfile::tempdir().expect("test root should be created");
        let started = Arc::new(Notify::new());
        let cancelled = Arc::new(Notify::new());
        let runner = CancellationAwareRunner {
            started: Arc::clone(&started),
            cancelled: Arc::clone(&cancelled),
        };
        let queue = spawn_workers_with_runner(runner_settings(root.path().join("runs")), runner);
        let dispatch = tokio::spawn({
            let queue = queue.clone();
            async move { queue.dispatch(validated_request()).await }
        });

        started.notified().await;
        dispatch.abort();
        let _ = dispatch.await;
        tokio::time::timeout(Duration::from_secs(1), cancelled.notified())
            .await
            .expect("runner should observe cancellation");
    }

    #[tokio::test]
    async fn worker_panic_becomes_service_failure() {
        let root = tempfile::tempdir().expect("test root should be created");
        let queue =
            spawn_workers_with_runner(runner_settings(root.path().join("runs")), PanicRunner);

        let result = queue.dispatch(validated_request()).await;

        assert!(matches!(
            result,
            Err(crate::service::DispatchError::ServiceFailure(_))
        ));
    }
}
