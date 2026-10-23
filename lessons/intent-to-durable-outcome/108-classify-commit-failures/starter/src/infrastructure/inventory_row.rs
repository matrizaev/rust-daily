use sqlx::{FromRow, sqlite::SqliteRow};

use crate::{
    application::StorageFailure,
    domain::{InventoryObservation, ItemId},
};

#[derive(FromRow)]
struct InventoryRow {
    item_id: i64,
    available: i64,
}

impl TryFrom<InventoryRow> for InventoryObservation {
    type Error = StorageFailure;

    fn try_from(row: InventoryRow) -> Result<Self, Self::Error> {
        let item_id = ItemId::new(row.item_id).ok_or(StorageFailure::InvalidStoredData)?;
        let available = u32::try_from(row.available)
            .map_err(|_| StorageFailure::InvalidStoredData)?;
        Ok(InventoryObservation::new(item_id, available))
    }
}

pub fn decode_inventory_row(
    row: SqliteRow,
) -> Result<InventoryObservation, StorageFailure> {
    let row = InventoryRow::from_row(&row).map_err(|_| StorageFailure::InvalidStoredData)?;
    row.try_into()
}
