use std::future::Future;

use sqlx::SqlitePool;

use crate::{
    application::{CommitOutcome, ReservationRepository, StorageFailure},
    domain::{InventoryObservation, ItemId, ReservationIntent},
};

pub struct SqliteReservationRepository {
    pool: SqlitePool,
}

impl SqliteReservationRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

impl ReservationRepository for SqliteReservationRepository {
    fn observe(
        &self,
        item_id: ItemId,
    ) -> impl Future<Output = Result<Option<InventoryObservation>, StorageFailure>> + Send {
        async move {
            let _ = item_id;
            todo!("select and decode inventory")
        }
    }

    fn commit(
        &self,
        intent: ReservationIntent,
    ) -> impl Future<Output = Result<CommitOutcome, StorageFailure>> + Send {
        async move {
            let _ = intent;
            todo!("guarded decrement and reservation insert in one transaction")
        }
    }
}
