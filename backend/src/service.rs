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

#[cfg(test)]
mod tests {
    use std::{
        num::NonZeroUsize,
        sync::{Arc, Mutex},
    };

    use tokio::sync::oneshot;

    use crate::model::{RunStatus, SubmittedFile};

    use super::*;

    #[derive(Clone)]
    struct StubQueue {
        behavior: Arc<Mutex<StubBehavior>>,
    }

    enum StubBehavior {
        Return(RunResult),
        Enqueue(EnqueueError),
        DropWorker,
    }

    impl StubQueue {
        fn returning(result: RunResult) -> Self {
            Self {
                behavior: Arc::new(Mutex::new(StubBehavior::Return(result))),
            }
        }

        fn enqueue_error(error: EnqueueError) -> Self {
            Self {
                behavior: Arc::new(Mutex::new(StubBehavior::Enqueue(error))),
            }
        }

        fn dropped_worker() -> Self {
            Self {
                behavior: Arc::new(Mutex::new(StubBehavior::DropWorker)),
            }
        }
    }

    impl RunQueuePort for StubQueue {
        fn try_enqueue(
            &self,
            _request: ValidatedRunRequest,
        ) -> Result<oneshot::Receiver<RunResult>, EnqueueError> {
            match &*self.behavior.lock().expect("stub queue lock") {
                StubBehavior::Return(result) => {
                    let (sender, receiver) = oneshot::channel();
                    sender
                        .send(result.clone())
                        .expect("receiver should be open");
                    Ok(receiver)
                }
                StubBehavior::Enqueue(error) => Err(match error {
                    EnqueueError::Full => EnqueueError::Full,
                    EnqueueError::Closed => EnqueueError::Closed,
                }),
                StubBehavior::DropWorker => {
                    let (_sender, receiver) = oneshot::channel();
                    Ok(receiver)
                }
            }
        }
    }

    fn valid_request() -> RunRequest {
        RunRequest::new(vec![
            SubmittedFile::new("src/lib.rs", "pub fn answer() -> u8 { 42 }\n"),
            SubmittedFile::new("tests/lesson.rs", "#[test]\nfn answer() {}\n"),
        ])
    }

    fn validation_limits() -> ValidationLimits {
        ValidationLimits::try_new(nonzero(8), nonzero(65536), nonzero(262144))
            .expect("test limits should be valid")
    }

    fn nonzero(value: usize) -> NonZeroUsize {
        NonZeroUsize::new(value).expect("test value should be non-zero")
    }

    #[tokio::test]
    async fn run_lesson_returns_worker_result() {
        let service = LessonRunService::new(
            StubQueue::returning(RunResult::new(
                RunStatus::Passed,
                "ok".to_string(),
                String::new(),
                12,
            )),
            validation_limits(),
        );

        let result = service
            .run_lesson(valid_request())
            .await
            .expect("service should return worker result");

        assert_eq!(result.status, RunStatus::Passed);
        assert_eq!(result.stdout, "ok");
    }

    #[tokio::test]
    async fn run_lesson_maps_validation_and_queue_failures() {
        let validation_service = LessonRunService::new(
            StubQueue::returning(RunResult::internal_error("unused", 0)),
            validation_limits(),
        );

        assert!(matches!(
            validation_service
                .run_lesson(RunRequest::new(Vec::new()))
                .await
                .expect_err("empty files should fail validation"),
            RunServiceError::Validation(ValidationError::EmptyFiles)
        ));

        let queue_service = LessonRunService::new(
            StubQueue::enqueue_error(EnqueueError::Full),
            validation_limits(),
        );

        assert!(matches!(
            queue_service
                .run_lesson(valid_request())
                .await
                .expect_err("queue full should propagate"),
            RunServiceError::Enqueue(EnqueueError::Full)
        ));
    }

    #[tokio::test]
    async fn run_lesson_maps_dropped_worker_channel() {
        let service = LessonRunService::new(StubQueue::dropped_worker(), validation_limits());

        assert!(matches!(
            service
                .run_lesson(valid_request())
                .await
                .expect_err("dropped channel should be reported"),
            RunServiceError::WorkerDropped
        ));
    }
}
