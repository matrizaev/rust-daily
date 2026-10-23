use std::sync::Mutex;

use crate::{
    application::{
        CommitOutcome, ReservationId, ReservationReceipt, ReservationRepository, StorageFailure,
    },
    domain::{InventoryObservation, ItemId, ReservationIntent},
};

struct State {
    available: u32,
    next_reservation_id: i64,
    commit_calls: usize,
}

pub struct ControlledRepository {
    item_id: ItemId,
    observed_available: u32,
    state: Mutex<State>,
}

impl ControlledRepository {
    pub fn new(item_id: ItemId, observed_available: u32, current_available: u32) -> Self {
        Self {
            item_id,
            observed_available,
            state: Mutex::new(State {
                available: current_available,
                next_reservation_id: 1,
                commit_calls: 0,
            }),
        }
    }

    pub fn current_available(&self) -> u32 {
        self.state
            .lock()
            .expect("controlled repository lock should work")
            .available
    }

    pub fn commit_calls(&self) -> usize {
        self.state
            .lock()
            .expect("controlled repository lock should work")
            .commit_calls
    }
}

impl ReservationRepository for ControlledRepository {
    fn observe(
        &self,
        item_id: ItemId,
    ) -> impl std::future::Future<Output = Result<Option<InventoryObservation>, StorageFailure>> + Send
    {
        let observation = (item_id == self.item_id)
            .then(|| InventoryObservation::new(self.item_id, self.observed_available));
        async move { Ok(observation) }
    }

    fn commit(
        &self,
        intent: ReservationIntent,
    ) -> impl std::future::Future<Output = Result<CommitOutcome, StorageFailure>> + Send {
        async move {
            let mut state = self
                .state
                .lock()
                .map_err(|_| StorageFailure::Database)?;
            state.commit_calls += 1;

            if intent.item_id() != self.item_id {
                return Err(StorageFailure::InvalidStoredData);
            }

            let requested = intent.quantity().value();
            if state.available < requested {
                return Ok(CommitOutcome::UnavailableAtCommit);
            }

            let reservation_id = ReservationId::new(state.next_reservation_id)
                .ok_or(StorageFailure::InvalidStoredData)?;
            let next_reservation_id = state
                .next_reservation_id
                .checked_add(1)
                .ok_or(StorageFailure::InvalidStoredData)?;

            state.available -= requested;
            state.next_reservation_id = next_reservation_id;

            Ok(CommitOutcome::Committed(ReservationReceipt::new(
                reservation_id,
                intent.item_id(),
                intent.quantity(),
            )))
        }
    }
}
