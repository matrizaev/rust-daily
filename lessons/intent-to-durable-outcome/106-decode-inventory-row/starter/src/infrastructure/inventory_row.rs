use sqlx::{FromRow, sqlite::SqliteRow};

use crate::{application::StorageFailure, domain::InventoryObservation};

#[derive(FromRow)]
struct InventoryRow {
    item_id: i64,
    available: i64,
}

impl TryFrom<InventoryRow> for InventoryObservation {
    type Error = StorageFailure;

    fn try_from(row: InventoryRow) -> Result<Self, Self::Error> {
        todo!("validate persisted fields before constructing the observation")
    }
}

pub fn decode_inventory_row(
    row: SqliteRow,
) -> Result<InventoryObservation, StorageFailure> {
    let row = InventoryRow::from_row(&row).map_err(|_| StorageFailure::InvalidStoredData)?;
    row.try_into()
}
