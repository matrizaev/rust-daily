//! Bounded asynchronous queue for lesson runner jobs.
//!
//! The queue provides backpressure, preserves per-request deadlines across
//! queueing and execution, and cancels work when callers drop the response.

use std::{
    future::Future,
    sync::{
        Arc,
        atomic::{AtomicBool, AtomicUsize, Ordering},
    },
    time::Duration,
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
pub(crate) trait LessonRunner: Clone + Send + Sync + 'static {
    /// Runs a validated request, publishing its outcome before bounded cleanup completes.
    fn run(
        &self,
        job_id: Uuid,
        request: ValidatedRunRequest,
        deadline: RunDeadline,
        cancellation: CancellationToken,
        outcome: OutcomePublisher,
    ) -> impl Future<Output = ()> + Send;
}

/// Single-use channel through which a runner publishes its terminal result.
pub(crate) struct OutcomePublisher {
    sender: Option<oneshot::Sender<Result<LearnerOutcome, ServiceFailure>>>,
}

impl OutcomePublisher {
    pub(crate) fn new(sender: oneshot::Sender<Result<LearnerOutcome, ServiceFailure>>) -> Self {
        Self {
            sender: Some(sender),
        }
    }

    /// Publishes the terminal result at most once.
    pub(crate) fn publish(&mut self, result: Result<LearnerOutcome, ServiceFailure>) -> bool {
        self.sender
            .take()
            .is_some_and(|sender| sender.send(result).is_ok())
    }
}

/// Cloneable handle for submitting work to the bounded runner queue.
#[derive(Clone)]
pub struct RunQueue {
    sender: mpsc::Sender<RunJob>,
    timeout: Duration,
    running_jobs: Arc<AtomicUsize>,
    workers: usize,
}

/// Point-in-time summary of the bounded runner queue.
#[derive(Debug, Clone, Copy, Eq, PartialEq)]
pub struct QueueSummary {
    /// Maximum number of jobs that can wait in the queue.
    queue_capacity: usize,
    /// Number of queue slots currently available.
    available_slots: usize,
    /// Number of jobs currently waiting for a worker.
    queued_depth: usize,
    /// Number of worker tasks currently running a job.
    running_jobs: usize,
    /// Number of configured worker tasks.
    workers: usize,
    /// Returns whether all queue receivers are closed.
    is_closed: bool,
}

impl QueueSummary {
    /// Creates a summary while preserving derived queue-depth consistency.
    pub fn new(
        queue_capacity: usize,
        available_slots: usize,
        running_jobs: usize,
        workers: usize,
        is_closed: bool,
    ) -> Self {
        let available_slots = available_slots.min(queue_capacity);

        Self {
            queue_capacity,
            available_slots,
            queued_depth: queue_capacity.saturating_sub(available_slots),
            running_jobs,
            workers,
            is_closed,
        }
    }

    /// Maximum number of jobs that can wait in the queue.
    pub fn queue_capacity(self) -> usize {
        self.queue_capacity
    }

    /// Number of queue slots currently available.
    pub fn available_slots(self) -> usize {
        self.available_slots
    }

    /// Number of jobs currently waiting for a worker.
    pub fn queued_depth(self) -> usize {
        self.queued_depth
    }

    /// Number of worker tasks currently running a job.
    pub fn running_jobs(self) -> usize {
        self.running_jobs
    }

    /// Number of configured worker tasks.
    pub fn workers(self) -> usize {
        self.workers
    }

    /// Returns whether all queue receivers are closed.
    pub fn is_closed(self) -> bool {
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
    control: JobControl,
}

struct EnqueuedRun {
    job_id: Uuid,
    response: oneshot::Receiver<Result<LearnerOutcome, ServiceFailure>>,
    control: JobControl,
}

#[derive(Clone)]
struct JobControl {
    deadline_expired: Arc<AtomicBool>,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
enum ResponseClosure {
    DeadlineExpired,
    ClientCancellation,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq)]
enum CancellationPhase {
    BeforeStart,
    WhileRunning,
}

impl JobControl {
    fn pending() -> Self {
        Self {
            deadline_expired: Arc::new(AtomicBool::new(false)),
        }
    }

    fn mark_deadline_expired(&self) {
        self.deadline_expired.store(true, Ordering::Release);
    }

    fn response_closure(&self) -> ResponseClosure {
        if self.deadline_expired.load(Ordering::Acquire) {
            ResponseClosure::DeadlineExpired
        } else {
            ResponseClosure::ClientCancellation
        }
    }
}

impl RunQueue {
    /// Returns a point-in-time summary of queue capacity and worker activity.
    pub fn summary(&self) -> QueueSummary {
        let queue_capacity = self.sender.max_capacity();
        let available_slots = self.sender.capacity();

        QueueSummary::new(
            queue_capacity,
            available_slots,
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
            .map(|enqueued| enqueued.response)
    }

    fn try_enqueue_with_deadline(
        &self,
        request: ValidatedRunRequest,
        deadline: RunDeadline,
    ) -> Result<EnqueuedRun, EnqueueError> {
        let (response_tx, response_rx) = oneshot::channel();
        let control = JobControl::pending();
        let job = RunJob {
            id: Uuid::new_v4(),
            request,
            response_tx,
            deadline,
            control: control.clone(),
        };
        let job_id = job.id;

        match self.sender.try_send(job) {
            Ok(()) => {
                counter!("rust_daily_runner_jobs_enqueued_total").increment(1);
                info!(%job_id, "job accepted");
                Ok(EnqueuedRun {
                    job_id,
                    response: response_rx,
                    control,
                })
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
        let EnqueuedRun {
            job_id,
            mut response,
            control,
        } = self
            .try_enqueue_with_deadline(request, deadline)
            .map_err(|error| match error {
                EnqueueError::Full => DispatchError::AtCapacity,
                EnqueueError::Closed(failure) => DispatchError::ServiceFailure(failure),
            })?;

        await_worker_response(job_id, &mut response, deadline, &control).await
    }
}

async fn await_worker_response(
    job_id: Uuid,
    response: &mut oneshot::Receiver<Result<LearnerOutcome, ServiceFailure>>,
    deadline: RunDeadline,
    control: &JobControl,
) -> Result<LearnerOutcome, DispatchError> {
    tokio::select! {
        biased;
        result = response => map_worker_response(job_id, result),
        () = tokio::time::sleep_until(deadline.expires_at()) => {
            control.mark_deadline_expired();
            let outcome = LearnerOutcome::timed_out(deadline);
            observability::record_runner_job_completed(outcome.status, outcome.duration_ms);
            info!(
                %job_id,
                duration_ms = outcome.duration_ms,
                "job reached its absolute deadline"
            );
            Ok(outcome)
        }
    }
}

fn map_worker_response(
    job_id: Uuid,
    response: Result<Result<LearnerOutcome, ServiceFailure>, oneshot::error::RecvError>,
) -> Result<LearnerOutcome, DispatchError> {
    match response {
        Ok(Ok(outcome)) => {
            observability::record_runner_job_completed(outcome.status, outcome.duration_ms);
            Ok(outcome)
        }
        Ok(Err(failure)) => {
            counter!("rust_daily_runner_jobs_failed_total").increment(1);
            Err(DispatchError::ServiceFailure(failure))
        }
        Err(_) => {
            counter!("rust_daily_runner_jobs_failed_total").increment(1);
            warn!(%job_id, "run worker dropped the result channel");
            Err(DispatchError::ServiceFailure(ServiceFailure::new(job_id)))
        }
    }
}

/// Spawns runner workers and returns a queue handle for dispatching jobs.
pub fn spawn_workers(config: Arc<RunnerSettings>) -> RunQueue {
    let runner = PodmanLessonRunner::new(Arc::clone(&config));
    spawn_workers_with_runner(config, runner)
}

pub(crate) fn spawn_workers_with_runner<R>(config: Arc<RunnerSettings>, runner: R) -> RunQueue
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
            match cancellation_reason(&job.control, CancellationPhase::BeforeStart) {
                Some(reason) => record_cancellation(
                    job_id,
                    worker_id,
                    reason,
                    "job skipped because result receiver was dropped",
                ),
                None => info!(%job_id, worker_id, "expired queued job skipped"),
            }
            continue;
        }

        info!(%job_id, worker_id, "job started by worker");

        running_jobs.fetch_add(1, Ordering::Relaxed);
        run_job(job, worker_id, runner.clone()).await;
        running_jobs.fetch_sub(1, Ordering::Relaxed);
    }
}

async fn run_job<R>(job: RunJob, worker_id: usize, runner: R)
where
    R: LessonRunner,
{
    let RunJob {
        id: job_id,
        request,
        response_tx,
        deadline,
        control,
    } = job;
    let cancellation = CancellationToken::new();
    let runner_cancellation = cancellation.clone();
    let (outcome_tx, mut outcome_rx) = oneshot::channel();
    let mut run_task = tokio::spawn(async move {
        runner
            .run(
                job_id,
                request,
                deadline,
                runner_cancellation,
                OutcomePublisher::new(outcome_tx),
            )
            .await;
    });
    let mut response_tx = response_tx;

    tokio::select! {
        biased;
        result = &mut outcome_rx => {
            let result = result.unwrap_or_else(|_| {
                Err(ServiceFailure::new(job_id))
            });
            log_runner_result(job_id, worker_id, &result);

            if response_tx.send(result).is_err() {
                record_closed_response(job_id, worker_id, &control);
                cancellation.cancel();
            }
            await_runner_task(job_id, worker_id, run_task).await;
        }
        result = &mut run_task => {
            let result = match result {
                Ok(()) => outcome_rx.await.unwrap_or_else(|_| Err(ServiceFailure::new(job_id))),
                Err(error) => Err(runner_task_failed(job_id, worker_id, error)),
            };
            log_runner_result(job_id, worker_id, &result);
            if response_tx.send(result).is_err() {
                record_closed_response(job_id, worker_id, &control);
            }
        }
        () = response_tx.closed() => {
            record_closed_response(job_id, worker_id, &control);
            cancellation.cancel();
            await_runner_task(job_id, worker_id, run_task).await;
        }
    }
}

fn log_runner_result(
    job_id: Uuid,
    worker_id: usize,
    result: &Result<LearnerOutcome, ServiceFailure>,
) {
    match result {
        Ok(outcome) => info!(
            %job_id,
            worker_id,
            status = ?outcome.status,
            duration_ms = outcome.duration_ms,
            "job outcome produced"
        ),
        Err(_) => warn!(%job_id, worker_id, "job failed internally"),
    }
}

fn record_closed_response(job_id: Uuid, worker_id: usize, control: &JobControl) {
    match cancellation_reason(control, CancellationPhase::WhileRunning) {
        Some(reason) => record_cancellation(
            job_id,
            worker_id,
            reason,
            "job canceled because result receiver was dropped",
        ),
        None => {
            info!(%job_id, worker_id, "deadline-expired job is being canceled and cleaned up");
        }
    }
}

fn cancellation_reason(control: &JobControl, phase: CancellationPhase) -> Option<&'static str> {
    match (control.response_closure(), phase) {
        (ResponseClosure::DeadlineExpired, _) => None,
        (ResponseClosure::ClientCancellation, CancellationPhase::BeforeStart) => {
            Some("response_dropped_before_start")
        }
        (ResponseClosure::ClientCancellation, CancellationPhase::WhileRunning) => {
            Some("response_dropped_while_running")
        }
    }
}

fn record_cancellation(
    job_id: Uuid,
    worker_id: usize,
    reason: &'static str,
    message: &'static str,
) {
    counter!("rust_daily_runner_jobs_canceled_total", "reason" => reason).increment(1);
    warn!(%job_id, worker_id, reason, "{message}");
}

async fn await_runner_task(job_id: Uuid, worker_id: usize, run_task: tokio::task::JoinHandle<()>) {
    if let Err(error) = run_task.await {
        let _ = runner_task_failed(job_id, worker_id, error);
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

    use tokio::sync::{Notify, Semaphore, mpsc};
    use tokio_util::sync::CancellationToken;
    use uuid::Uuid;

    use crate::config::{
        ContainerCpus, CoreUlimit, PodmanPath, RunnerImage, RunnerSettings, WorkspaceRoot,
    };
    use crate::model::{
        LearnerOutcome, RunDeadline, RunRequest, RunRequestValidation, RunStatus, ServiceFailure,
        SubmittedFile, ValidatedRunRequest, ValidationLimits,
    };

    use super::{
        CancellationPhase, EnqueueError, JobControl, LessonRunner, QueueSummary, ResponseClosure,
        RunJob, RunQueue, await_worker_response, cancellation_reason, spawn_workers_with_runner,
    };
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
            mut outcome: super::OutcomePublisher,
        ) {
            outcome.publish(Ok(LearnerOutcome::new(
                RunStatus::Passed,
                "ok".to_string(),
                String::new(),
                _deadline.elapsed_ms(),
            )));
        }
    }

    #[derive(Clone)]
    struct CancellationAwareRunner {
        started: Arc<Notify>,
        cancelled: Arc<Notify>,
    }

    #[derive(Clone)]
    struct OutcomeThenCleanupRunner {
        starts: Arc<AtomicUsize>,
        cleanup_permits: Arc<Semaphore>,
        status: RunStatus,
    }

    impl LessonRunner for OutcomeThenCleanupRunner {
        async fn run(
            &self,
            _job_id: Uuid,
            _request: ValidatedRunRequest,
            deadline: RunDeadline,
            _cancellation: CancellationToken,
            mut outcome: super::OutcomePublisher,
        ) {
            self.starts.fetch_add(1, Ordering::Relaxed);
            outcome.publish(Ok(LearnerOutcome::new(
                self.status,
                "ok".to_string(),
                String::new(),
                deadline.elapsed_ms(),
            )));
            self.cleanup_permits
                .acquire()
                .await
                .expect("cleanup semaphore should remain open")
                .forget();
        }
    }

    #[derive(Clone)]
    struct CountingRunner {
        starts: Arc<AtomicUsize>,
    }

    impl LessonRunner for CountingRunner {
        async fn run(
            &self,
            _job_id: Uuid,
            _request: ValidatedRunRequest,
            deadline: RunDeadline,
            _cancellation: CancellationToken,
            mut outcome: super::OutcomePublisher,
        ) {
            self.starts.fetch_add(1, Ordering::Relaxed);
            outcome.publish(Ok(LearnerOutcome::new(
                RunStatus::Passed,
                String::new(),
                String::new(),
                deadline.elapsed_ms(),
            )));
        }
    }

    #[derive(Clone, Copy)]
    struct OutcomeThenPanicRunner;

    impl LessonRunner for OutcomeThenPanicRunner {
        async fn run(
            &self,
            _job_id: Uuid,
            _request: ValidatedRunRequest,
            deadline: RunDeadline,
            _cancellation: CancellationToken,
            mut outcome: super::OutcomePublisher,
        ) {
            outcome.publish(Ok(LearnerOutcome::new(
                RunStatus::Passed,
                "published".to_string(),
                String::new(),
                deadline.elapsed_ms(),
            )));
            panic!("simulated cleanup failure after publication");
        }
    }

    impl LessonRunner for CancellationAwareRunner {
        async fn run(
            &self,
            _job_id: Uuid,
            _request: ValidatedRunRequest,
            _deadline: RunDeadline,
            cancellation: CancellationToken,
            mut outcome: super::OutcomePublisher,
        ) {
            self.started.notify_one();
            cancellation.cancelled().await;
            self.cancelled.notify_one();
            outcome.publish(Err(ServiceFailure::new(Uuid::nil())));
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
            _outcome: super::OutcomePublisher,
        ) {
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

    #[tokio::test(start_paused = true)]
    async fn dispatch_returns_timed_out_for_expired_queued_job_without_worker() {
        let (sender, mut receiver) = mpsc::channel(1);
        let queue = test_queue(sender, Duration::from_secs(1));

        let result = queue.dispatch(validated_request()).await;
        let job = receiver.recv().await.expect("job should remain queued");

        let outcome = result.expect("deadline expiry should be a learner outcome");
        assert_eq!(outcome.status, RunStatus::TimedOut);
        assert_eq!(outcome.duration_ms, 1000);
        assert!(job.response_tx.is_closed());
        assert_eq!(
            job.control.response_closure(),
            ResponseClosure::DeadlineExpired
        );
    }

    #[tokio::test(start_paused = true)]
    async fn ready_runner_result_wins_at_the_exact_deadline() {
        let deadline = RunDeadline::after(Duration::ZERO);
        let control = JobControl::pending();
        let (response_tx, mut response_rx) = tokio::sync::oneshot::channel();
        response_tx
            .send(Ok(LearnerOutcome::new(
                RunStatus::Passed,
                "ok".to_string(),
                String::new(),
                0,
            )))
            .expect("result receiver should remain open");

        let result = await_worker_response(Uuid::new_v4(), &mut response_rx, deadline, &control)
            .await
            .expect("ready runner result should win");

        assert_eq!(result.status, RunStatus::Passed);
        assert_eq!(
            control.response_closure(),
            ResponseClosure::ClientCancellation
        );
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

    #[test]
    fn queue_summary_derives_depth_from_capacity_and_available_slots() {
        let summary = QueueSummary::new(20, 19, 0, 2, false);

        assert_eq!(summary.queued_depth(), 1);
    }

    #[test]
    fn job_control_distinguishes_deadline_expiry_from_client_cancellation() {
        let control = JobControl::pending();
        assert_eq!(
            control.response_closure(),
            ResponseClosure::ClientCancellation
        );

        control.mark_deadline_expired();

        assert_eq!(control.response_closure(), ResponseClosure::DeadlineExpired);
    }

    #[test]
    fn deadline_expiry_does_not_emit_client_cancellation_reasons() {
        let pending = JobControl::pending();
        assert_eq!(
            cancellation_reason(&pending, CancellationPhase::BeforeStart),
            Some("response_dropped_before_start")
        );
        assert_eq!(
            cancellation_reason(&pending, CancellationPhase::WhileRunning),
            Some("response_dropped_while_running")
        );

        pending.mark_deadline_expired();

        assert_eq!(
            cancellation_reason(&pending, CancellationPhase::BeforeStart),
            None
        );
        assert_eq!(
            cancellation_reason(&pending, CancellationPhase::WhileRunning),
            None
        );
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

    #[tokio::test(start_paused = true)]
    async fn outcome_is_delivered_before_cleanup_without_reusing_the_worker() {
        let root = tempfile::tempdir().expect("test root should be created");
        let starts = Arc::new(AtomicUsize::new(0));
        let cleanup_permits = Arc::new(Semaphore::new(0));
        let runner = OutcomeThenCleanupRunner {
            starts: Arc::clone(&starts),
            cleanup_permits: Arc::clone(&cleanup_permits),
            status: RunStatus::Passed,
        };
        let queue = spawn_workers_with_runner(runner_settings(root.path().join("runs")), runner);

        let first = queue
            .dispatch(validated_request())
            .await
            .expect("outcome should arrive before cleanup");
        assert_eq!(first.status, RunStatus::Passed);
        assert_eq!(queue.summary().running_jobs(), 1);

        let second = tokio::spawn({
            let queue = queue.clone();
            async move { queue.dispatch(validated_request()).await }
        });
        tokio::task::yield_now().await;
        assert_eq!(starts.load(Ordering::Relaxed), 1);
        assert_eq!(queue.summary().queued_depth(), 1);

        tokio::time::advance(Duration::from_millis(10)).await;
        cleanup_permits.add_permits(1);
        let second = second
            .await
            .expect("second dispatch task should complete")
            .expect("second outcome should arrive after worker reuse");
        assert_eq!(second.status, RunStatus::Passed);
        assert!(second.duration_ms >= 10);
        assert_eq!(starts.load(Ordering::Relaxed), 2);

        cleanup_permits.add_permits(1);
        tokio::task::yield_now().await;
        assert_eq!(queue.summary().running_jobs(), 0);
    }

    #[tokio::test(start_paused = true)]
    async fn running_deadline_returns_timeout_and_cancels_execution() {
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
        tokio::time::advance(Duration::from_secs(1)).await;

        let outcome = dispatch
            .await
            .expect("dispatch task should finish")
            .expect("deadline should be a learner outcome");
        assert_eq!(outcome.status, RunStatus::TimedOut);
        assert_eq!(outcome.duration_ms, 1000);
        cancelled.notified().await;
    }

    #[tokio::test(start_paused = true)]
    async fn expired_queued_job_is_skipped_when_a_worker_receives_it_later() {
        let (sender, receiver) = mpsc::channel(1);
        let queue = test_queue(sender, Duration::from_secs(1));
        let dispatch = tokio::spawn({
            let queue = queue.clone();
            async move { queue.dispatch(validated_request()).await }
        });
        tokio::task::yield_now().await;
        tokio::time::advance(Duration::from_secs(1)).await;

        let outcome = dispatch
            .await
            .expect("dispatch task should finish")
            .expect("deadline should be a learner outcome");
        assert_eq!(outcome.status, RunStatus::TimedOut);

        let starts = Arc::new(AtomicUsize::new(0));
        let runner = CountingRunner {
            starts: Arc::clone(&starts),
        };
        let running_jobs = Arc::new(AtomicUsize::new(0));
        drop(queue);
        super::worker_loop(
            0,
            Arc::new(tokio::sync::Mutex::new(receiver)),
            runner,
            Arc::clone(&running_jobs),
        )
        .await;

        assert_eq!(starts.load(Ordering::Relaxed), 0);
        assert_eq!(running_jobs.load(Ordering::Relaxed), 0);
    }

    #[tokio::test]
    async fn failure_after_publication_does_not_replace_the_outcome() {
        let root = tempfile::tempdir().expect("test root should be created");
        let queue = spawn_workers_with_runner(
            runner_settings(root.path().join("runs")),
            OutcomeThenPanicRunner,
        );

        let outcome = queue
            .dispatch(validated_request())
            .await
            .expect("published outcome should survive later runner failure");

        assert_eq!(outcome.status, RunStatus::Passed);
        assert_eq!(outcome.stdout, "published");
    }

    #[tokio::test(start_paused = true)]
    async fn failed_and_compile_error_durations_include_queue_wait() {
        for status in [RunStatus::Failed, RunStatus::CompileError] {
            let root = tempfile::tempdir().expect("test root should be created");
            let starts = Arc::new(AtomicUsize::new(0));
            let cleanup_permits = Arc::new(Semaphore::new(0));
            let runner = OutcomeThenCleanupRunner {
                starts,
                cleanup_permits: Arc::clone(&cleanup_permits),
                status,
            };
            let queue =
                spawn_workers_with_runner(runner_settings(root.path().join("runs")), runner);

            let first = queue
                .dispatch(validated_request())
                .await
                .expect("first outcome should publish");
            assert_eq!(first.status, status);

            let second = tokio::spawn({
                let queue = queue.clone();
                async move { queue.dispatch(validated_request()).await }
            });
            tokio::task::yield_now().await;
            tokio::time::advance(Duration::from_millis(250)).await;
            cleanup_permits.add_permits(1);

            let second = second
                .await
                .expect("second dispatch task should finish")
                .expect("second outcome should publish");
            assert_eq!(second.status, status);
            assert_eq!(second.duration_ms, 250);

            cleanup_permits.add_permits(1);
            tokio::task::yield_now().await;
        }
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
