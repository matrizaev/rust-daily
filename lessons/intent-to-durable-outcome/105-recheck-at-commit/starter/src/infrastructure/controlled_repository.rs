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
        todo!("initialize observed facts and current commit state")
    }

    pub fn current_available(&self) -> u32 {
        todo!("read current stock")
    }

    pub fn commit_calls(&self) -> usize {
        todo!("report commit attempts")
    }
}

impl ReservationRepository for ControlledRepository {
    fn observe(
        &self,
        item_id: ItemId,
    ) -> impl std::future::Future<Output = Result<Option<InventoryObservation>, StorageFailure>> + Send
    {
        async move { todo!("return the earlier observation") }
    }

    fn commit(
        &self,
        intent: ReservationIntent,
    ) -> impl std::future::Future<Output = Result<CommitOutcome, StorageFailure>> + Send {
        async move {
            let _ = intent;
            todo!("recheck and reserve current stock atomically")
        }
    }
}
