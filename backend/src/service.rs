use thiserror::Error;
use tokio::sync::oneshot;

use crate::{
    model::{
        RunRequest, RunRequestValidation, RunResult, ValidatedRunRequest, ValidationError,
        ValidationLimits,
    },
    queue::{EnqueueError, RunQueue},
};

pub type AppService = LessonRunService<RunQueue>;

pub trait RunQueuePort: Clone + Send + Sync + 'static {
    fn try_enqueue(
        &self,
        request: ValidatedRunRequest,
    ) -> Result<oneshot::Receiver<RunResult>, EnqueueError>;
}

impl RunQueuePort for RunQueue {
    fn try_enqueue(
        &self,
        request: ValidatedRunRequest,
    ) -> Result<oneshot::Receiver<RunResult>, EnqueueError> {
        RunQueue::try_enqueue(self, request)
    }
}

#[derive(Clone)]
pub struct LessonRunService<Q> {
    queue: Q,
    validation_limits: ValidationLimits,
}

impl<Q> LessonRunService<Q>
where
    Q: RunQueuePort,
{
    pub fn new(queue: Q, validation_limits: ValidationLimits) -> Self {
        Self {
            queue,
            validation_limits,
        }
    }

    pub async fn run_lesson(&self, request: RunRequest) -> Result<RunResult, RunServiceError> {
        let request = ValidatedRunRequest::try_from(RunRequestValidation::new(
            request,
            self.validation_limits,
        ))?;
        let response_rx = self.queue.try_enqueue(request)?;

        response_rx
            .await
            .map_err(|_| RunServiceError::WorkerDropped)
    }
}

#[derive(Debug, Error)]
pub enum RunServiceError {
    #[error(transparent)]
    Validation(#[from] ValidationError),
    #[error(transparent)]
    Enqueue(#[from] EnqueueError),
    #[error("run worker dropped the result channel")]
    WorkerDropped,
}
