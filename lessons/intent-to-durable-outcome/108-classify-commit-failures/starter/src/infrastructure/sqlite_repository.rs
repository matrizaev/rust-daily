use std::future::Future;

use sqlx::{Row, SqlitePool};

use crate::{
    application::{
        CommitOutcome, ReservationId, ReservationReceipt, ReservationRepository, StorageFailure,
    },
    domain::{InventoryObservation, ItemId, ReservationIntent},
    infrastructure::inventory_row::decode_inventory_row,
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
            let row = sqlx::query("SELECT item_id, available FROM inventory WHERE item_id = ?")
                .bind(item_id.value())
                .fetch_optional(&self.pool)
                .await
                .map_err(|_| StorageFailure::Database)?;

            row.map(decode_inventory_row).transpose()
        }
    }

    fn commit(
        &self,
        intent: ReservationIntent,
    ) -> impl Future<Output = Result<CommitOutcome, StorageFailure>> + Send {
        async move {
            let mut transaction = self
                .pool
                .begin()
                .await
                .map_err(|_| StorageFailure::Database)?;
            let item_id = intent.item_id().value();
            let quantity = i64::from(intent.quantity().value());
            let update = sqlx::query(
                "UPDATE inventory SET available = available - ? \
                 WHERE item_id = ? AND available >= ?",
            )
            .bind(quantity)
            .bind(item_id)
            .bind(quantity)
            .execute(&mut *transaction)
            .await
            .map_err(|_| StorageFailure::CommitOutcomeUnknown)?;

            if update.rows_affected() == 0 {
                return match transaction.rollback().await {
                    Ok(()) => Ok(CommitOutcome::UnavailableAtCommit),
                    Err(_) => Err(StorageFailure::CommitOutcomeUnknown),
                };
            }

            let row = sqlx::query(
                "INSERT INTO reservations (item_id, quantity) VALUES (?, ?) \
                 RETURNING reservation_id",
            )
            .bind(item_id)
            .bind(quantity)
            .fetch_one(&mut *transaction)
            .await
            .map_err(|_| StorageFailure::CommitOutcomeUnknown)?;
            let raw_reservation_id = row
                .try_get::<i64, _>("reservation_id")
                .map_err(|_| StorageFailure::CommitOutcomeUnknown)?;
            let reservation_id = ReservationId::new(raw_reservation_id)
                .ok_or(StorageFailure::CommitOutcomeUnknown)?;
            let receipt = ReservationReceipt::new(
                reservation_id,
                intent.item_id(),
                intent.quantity(),
            );

            transaction
                .commit()
                .await
                .map_err(|_| StorageFailure::CommitOutcomeUnknown)?;

            Ok(CommitOutcome::Committed(receipt))
        }
    }
}
