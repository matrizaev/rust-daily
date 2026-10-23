use std::{future::Future, sync::Mutex};

use rust_daily_lesson::{
    application::{
        CommitOutcome, ReservationError, ReservationRepository, StorageFailure,
        reservations::reserve,
    },
    domain::{
        InventoryObservation, ItemId, PolicyRejection, Quantity, ReservationCommand,
        ReservationRequest,
    },
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Call {
    Observe(ItemId),
    Commit(ItemId, Quantity),
}

struct RecordingRepository {
    observation: Option<InventoryObservation>,
    commit_result: Result<CommitOutcome, StorageFailure>,
    calls: Mutex<Vec<Call>>,
}

impl RecordingRepository {
    fn new(
        observation: Option<InventoryObservation>,
        commit_result: Result<CommitOutcome, StorageFailure>,
    ) -> Self {
        Self {
            observation,
            commit_result,
            calls: Mutex::new(Vec::new()),
        }
    }

    fn calls(&self) -> Vec<Call> {
        self.calls.lock().expect("call log lock should work").clone()
    }
}

impl ReservationRepository for RecordingRepository {
    fn observe(
        &self,
        item_id: ItemId,
    ) -> impl Future<Output = Result<Option<InventoryObservation>, StorageFailure>> + Send {
        self.calls
            .lock()
            .expect("call log lock should work")
            .push(Call::Observe(item_id));
        let observation = self.observation;
        async move { Ok(observation) }
    }

    fn commit(
        &self,
        intent: rust_daily_lesson::domain::ReservationIntent,
    ) -> impl Future<Output = Result<CommitOutcome, StorageFailure>> + Send {
        self.calls
            .lock()
            .expect("call log lock should work")
            .push(Call::Commit(intent.item_id(), intent.quantity()));
        let result = self.commit_result;
        async move { result }
    }
}

fn item_id(value: i64) -> ItemId {
    ItemId::new(value).expect("test item id should be positive")
}

fn quantity(value: u32) -> Quantity {
    Quantity::new(value).expect("test quantity should be positive")
}

fn command(item: i64, amount: u32) -> ReservationCommand {
    ReservationCommand::try_from(ReservationRequest {
        item_id: item,
        quantity: amount,
    })
    .expect("test request should be valid")
}

fn no_commit() -> Result<CommitOutcome, StorageFailure> {
    Ok(CommitOutcome::UnavailableAtCommit)
}

#[tokio::test]
async fn missing_item_stops_after_observation() {
    let repository = RecordingRepository::new(None, no_commit());

    let result = reserve(&repository, command(1, 3)).await;

    assert_eq!(result, Err(ReservationError::ItemNotFound));
    assert_eq!(repository.calls(), [Call::Observe(item_id(1))]);
}

#[tokio::test]
async fn policy_rejection_stops_before_commit() {
    let repository = RecordingRepository::new(
        Some(InventoryObservation::new(item_id(1), 2)),
        no_commit(),
    );

    let result = reserve(&repository, command(1, 3)).await;

    assert_eq!(
        result,
        Err(ReservationError::PolicyRejected(
            PolicyRejection::InsufficientObservedInventory
        ))
    );
    assert_eq!(repository.calls(), [Call::Observe(item_id(1))]);
}

#[tokio::test]
async fn accepted_intent_is_committed_once_and_outcome_is_preserved() {
    let repository = RecordingRepository::new(
        Some(InventoryObservation::new(item_id(1), 5)),
        no_commit(),
    );

    let result = reserve(&repository, command(1, 3)).await;

    assert_eq!(result, Err(ReservationError::UnavailableAtCommit));
    assert_eq!(
        repository.calls(),
        [Call::Observe(item_id(1)), Call::Commit(item_id(1), quantity(3))]
    );
}

#[tokio::test]
async fn storage_failure_is_preserved() {
    let repository = RecordingRepository::new(
        Some(InventoryObservation::new(item_id(1), 5)),
        Err(StorageFailure::CommitOutcomeUnknown),
    );

    let result = reserve(&repository, command(1, 3)).await;

    assert_eq!(
        result,
        Err(ReservationError::Storage(StorageFailure::CommitOutcomeUnknown))
    );
    assert_eq!(repository.calls().len(), 2);
}
