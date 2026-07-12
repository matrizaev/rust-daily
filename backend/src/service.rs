use std::future::Future;

use thiserror::Error;

use crate::{
    model::{
        RunRequest, RunRequestValidation, RunResult, ValidatedRunRequest, ValidationError,
        ValidationLimits,
    },
    queue::RunQueue,
};

pub type AppService = LessonRunService<RunQueue>;

pub trait RunDispatcher: Clone + Send + Sync + 'static {
    fn dispatch(
        &self,
        request: ValidatedRunRequest,
    ) -> impl Future<Output = Result<RunResult, DispatchError>> + Send;
}

#[derive(Clone)]
pub struct LessonRunService<Q> {
    queue: Q,
    validation_limits: ValidationLimits,
}

impl<Q> LessonRunService<Q>
where
    Q: RunDispatcher,
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
        self.queue.dispatch(request).await.map_err(Into::into)
    }
}

#[derive(Debug, Clone, Copy, Error, Eq, PartialEq)]
pub enum DispatchError {
    #[error("too many run requests are queued")]
    AtCapacity,
    #[error("run queue is unavailable")]
    Unavailable,
    #[error("run worker dropped the result channel")]
    WorkerLost,
}

#[derive(Debug, Error)]
pub enum RunServiceError {
    #[error(transparent)]
    Validation(#[from] ValidationError),
    #[error(transparent)]
    Dispatch(#[from] DispatchError),
}

#[cfg(test)]
mod tests {
    use std::{
        num::NonZeroUsize,
        sync::{Arc, Mutex},
    };

    use crate::model::{RunStatus, SubmittedFile};

    use super::*;

    #[derive(Clone)]
    struct StubQueue {
        behavior: Arc<Mutex<StubBehavior>>,
    }

    enum StubBehavior {
        Return(RunResult),
        Dispatch(DispatchError),
    }

    impl StubQueue {
        fn returning(result: RunResult) -> Self {
            Self {
                behavior: Arc::new(Mutex::new(StubBehavior::Return(result))),
            }
        }

        fn dispatch_error(error: DispatchError) -> Self {
            Self {
                behavior: Arc::new(Mutex::new(StubBehavior::Dispatch(error))),
            }
        }
    }

    impl RunDispatcher for StubQueue {
        async fn dispatch(
            &self,
            _request: ValidatedRunRequest,
        ) -> Result<RunResult, DispatchError> {
            match &*self.behavior.lock().expect("stub queue lock") {
                StubBehavior::Return(result) => Ok(result.clone()),
                StubBehavior::Dispatch(error) => Err(match error {
                    DispatchError::AtCapacity => DispatchError::AtCapacity,
                    DispatchError::Unavailable => DispatchError::Unavailable,
                    DispatchError::WorkerLost => DispatchError::WorkerLost,
                }),
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
            StubQueue::dispatch_error(DispatchError::AtCapacity),
            validation_limits(),
        );

        assert!(matches!(
            queue_service
                .run_lesson(valid_request())
                .await
                .expect_err("queue full should propagate"),
            RunServiceError::Dispatch(DispatchError::AtCapacity)
        ));
    }

    #[tokio::test]
    async fn run_lesson_maps_dropped_worker_channel() {
        let service = LessonRunService::new(
            StubQueue::dispatch_error(DispatchError::WorkerLost),
            validation_limits(),
        );

        assert!(matches!(
            service
                .run_lesson(valid_request())
                .await
                .expect_err("dropped channel should be reported"),
            RunServiceError::Dispatch(DispatchError::WorkerLost)
        ));
    }
}
