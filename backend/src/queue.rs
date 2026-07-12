use std::{future::Future, sync::Arc};

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
    runner::PodmanLessonRunner,
    service::{DispatchError, RunDispatcher},
};

pub trait LessonRunner: Clone + Send + Sync + 'static {
    fn run(
        &self,
        job_id: Uuid,
        request: ValidatedRunRequest,
        deadline: RunDeadline,
        cancellation: CancellationToken,
    ) -> impl Future<Output = Result<LearnerOutcome, ServiceFailure>> + Send;
}

#[derive(Clone)]
pub struct RunQueue {
    sender: mpsc::Sender<RunJob>,
    timeout: std::time::Duration,
}

#[derive(Debug, Error)]
pub enum EnqueueError {
    #[error("too many run requests are queued")]
    Full,
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
                info!(%job_id, "job accepted");
                Ok((job_id, response_rx))
            }
            Err(mpsc::error::TrySendError::Full(job)) => {
                warn!(job_id = %job.id, "job rejected due to queue capacity");
                Err(EnqueueError::Full)
            }
            Err(mpsc::error::TrySendError::Closed(job)) => {
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

    for worker_id in 0..config.workers.get() {
        tokio::spawn(worker_loop(
            worker_id,
            Arc::clone(&receiver),
            runner.clone(),
        ));
    }

    RunQueue {
        sender,
        timeout: config.timeout,
    }
}

async fn worker_loop<R>(worker_id: usize, receiver: Arc<Mutex<mpsc::Receiver<RunJob>>>, runner: R)
where
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
            warn!(%job_id, worker_id, "job skipped because result receiver was dropped");
            continue;
        }

        info!(%job_id, worker_id, "job started by worker");

        run_job(job, worker_id, runner.clone()).await;
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

            if job.response_tx.send(result).is_err() {
                warn!(%job_id, worker_id, "job result receiver was dropped");
            }
        }
        () = job.response_tx.closed() => {
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
        sync::Arc,
        time::Duration,
    };

    use tokio::sync::{Notify, mpsc};
    use tokio_util::sync::CancellationToken;
    use uuid::Uuid;

    use crate::config::{PodmanPath, RunnerImage, RunnerSettings, WorkspaceRoot};
    use crate::model::{
        LearnerOutcome, RunDeadline, RunRequest, RunRequestValidation, RunStatus, ServiceFailure,
        SubmittedFile, ValidatedRunRequest, ValidationLimits,
    };

    use super::{EnqueueError, LessonRunner, RunQueue, spawn_workers_with_runner};
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
            service_memory_max_bytes: NonZeroU64::new(1024 * 1024 * 1024)
                .expect("service memory should be nonzero"),
            workspace_root_budget_bytes: NonZeroU64::new(2 * 1024 * 1024 * 1024)
                .expect("workspace budget should be nonzero"),
            enforce_host_resource_limits: false,
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
        let queue = RunQueue {
            sender,
            timeout: std::time::Duration::from_secs(10),
        };

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
        let queue = RunQueue {
            sender,
            timeout: std::time::Duration::from_secs(10),
        };
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
        let queue = RunQueue {
            sender,
            timeout: std::time::Duration::from_secs(10),
        };

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
        let queue = RunQueue {
            sender,
            timeout: std::time::Duration::from_millis(10),
        };

        let result = queue.dispatch(validated_request()).await;
        let job = receiver.recv().await.expect("job should remain queued");

        assert!(matches!(
            result,
            Err(crate::service::DispatchError::ServiceFailure(_))
        ));
        assert!(job.response_tx.is_closed());
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
