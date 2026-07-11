use std::sync::Arc;

use thiserror::Error;
use tokio::{
    sync::{Mutex, mpsc, oneshot},
    task::JoinError,
};
use tracing::{info, warn};
use uuid::Uuid;

use crate::{
    config::RunnerSettings,
    model::{RunResult, ValidatedRunRequest},
    runner,
};

#[derive(Clone)]
pub struct RunQueue {
    sender: mpsc::Sender<RunJob>,
}

#[derive(Debug, Error)]
pub enum EnqueueError {
    #[error("too many run requests are queued")]
    Full,
    #[error("run queue is unavailable")]
    Closed,
}

struct RunJob {
    id: Uuid,
    request: ValidatedRunRequest,
    response_tx: oneshot::Sender<RunResult>,
}

impl RunQueue {
    pub fn try_enqueue(
        &self,
        request: ValidatedRunRequest,
    ) -> Result<oneshot::Receiver<RunResult>, EnqueueError> {
        let (response_tx, response_rx) = oneshot::channel();
        let job = RunJob {
            id: Uuid::new_v4(),
            request,
            response_tx,
        };
        let job_id = job.id;

        match self.sender.try_send(job) {
            Ok(()) => {
                info!(%job_id, "job accepted");
                Ok(response_rx)
            }
            Err(mpsc::error::TrySendError::Full(job)) => {
                warn!(job_id = %job.id, "job rejected due to queue capacity");
                Err(EnqueueError::Full)
            }
            Err(mpsc::error::TrySendError::Closed(job)) => {
                warn!(job_id = %job.id, "job rejected because queue is closed");
                Err(EnqueueError::Closed)
            }
        }
    }
}

pub fn spawn_workers(config: Arc<RunnerSettings>) -> RunQueue {
    let (sender, receiver) = mpsc::channel(config.queue_capacity.get());
    let receiver = Arc::new(Mutex::new(receiver));

    for worker_id in 0..config.workers.get() {
        tokio::spawn(worker_loop(
            worker_id,
            Arc::clone(&receiver),
            Arc::clone(&config),
        ));
    }

    RunQueue { sender }
}

async fn worker_loop(
    worker_id: usize,
    receiver: Arc<Mutex<mpsc::Receiver<RunJob>>>,
    config: Arc<RunnerSettings>,
) {
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

        run_job(job, worker_id, Arc::clone(&config)).await;
    }
}

async fn run_job(mut job: RunJob, worker_id: usize, config: Arc<RunnerSettings>) {
    let job_id = job.id;
    let run_task = tokio::spawn(async move { runner::run(job_id, job.request, &config).await });
    tokio::pin!(run_task);

    tokio::select! {
        result = &mut run_task => {
            let result = match result {
                Ok(result) => result,
                Err(error) => runner_task_failed(job_id, worker_id, error),
            };
            info!(
                %job_id,
                worker_id,
                status = ?result.status,
                duration_ms = result.duration_ms,
                "job finished"
            );

            if job.response_tx.send(result).is_err() {
                warn!(%job_id, worker_id, "job result receiver was dropped");
            }
        }
        () = job.response_tx.closed() => {
            warn!(%job_id, worker_id, "job canceled because result receiver was dropped");
            run_task.abort();
            let _ = run_task.await;
        }
    }
}

fn runner_task_failed(job_id: Uuid, worker_id: usize, error: JoinError) -> RunResult {
    warn!(%job_id, worker_id, error = %error, "runner task failed");
    RunResult::internal_error("runner task failed", 0)
}

#[cfg(test)]
mod tests {
    use std::num::NonZeroUsize;

    use tokio::sync::mpsc;

    use crate::model::{
        RunRequest, RunRequestValidation, SubmittedFile, ValidatedRunRequest, ValidationLimits,
    };

    use super::{EnqueueError, RunQueue};

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
        ValidationLimits::try_new(nonzero(8), nonzero(65536), nonzero(262144))
            .expect("test limits should be valid")
    }

    fn nonzero(value: usize) -> NonZeroUsize {
        NonZeroUsize::new(value).expect("test value should be non-zero")
    }

    #[tokio::test]
    async fn try_enqueue_accepts_jobs_until_capacity() {
        let (sender, mut receiver) = mpsc::channel(1);
        let queue = RunQueue { sender };

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
        let queue = RunQueue { sender };
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
        let queue = RunQueue { sender };

        let error = queue
            .try_enqueue(validated_request())
            .expect_err("closed channel should reject enqueue");

        assert!(matches!(error, EnqueueError::Closed));
    }
}
