use rust_daily_lesson::{
    application::StorageFailure,
    domain::{ItemId, InventoryObservation},
    infrastructure::inventory_row::decode_inventory_row,
};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions, SqliteRow};

async fn pool() -> SqlitePool {
    let options = SqliteConnectOptions::new()
        .filename(":memory:")
        .foreign_keys(true);
    let pool = SqlitePoolOptions::new()
        .max_connections(1)
        .connect_with(options)
        .await
        .expect("in-memory SQLite should open");
    sqlx::migrate!("./testdata/migrations")
        .run(&pool)
        .await
        .expect("inventory migrations should apply");
    pool
}

async fn row(pool: &SqlitePool, item_id: i64, available: i64) -> SqliteRow {
    sqlx::query("SELECT ? AS item_id, ? AS available")
        .bind(item_id)
        .bind(available)
        .fetch_one(pool)
        .await
        .expect("row query should succeed")
}

#[tokio::test]
async fn decodes_valid_integer_columns_into_domain_values() {
    let pool = pool().await;
    let row = row(&pool, 7, 4).await;

    let observation = decode_inventory_row(row).expect("stored values should decode");

    assert_eq!(observation, InventoryObservation::new(ItemId::new(7).unwrap(), 4));
}

#[tokio::test]
async fn rejects_non_positive_stored_item_ids() {
    let pool = pool().await;
    let row = row(&pool, 0, 4).await;

    assert_eq!(
        decode_inventory_row(row),
        Err(StorageFailure::InvalidStoredData)
    );
}

#[tokio::test]
async fn rejects_negative_and_out_of_range_stock() {
    let pool = pool().await;
    let negative = row(&pool, 7, -1).await;
    let too_large = row(&pool, 7, i64::from(u32::MAX) + 1).await;

    assert_eq!(
        decode_inventory_row(negative),
        Err(StorageFailure::InvalidStoredData)
    );
    assert_eq!(
        decode_inventory_row(too_large),
        Err(StorageFailure::InvalidStoredData)
    );
}

#[tokio::test]
async fn maps_missing_columns_to_invalid_stored_data() {
    let pool = pool().await;
    let row = sqlx::query("SELECT 7 AS item_id")
        .fetch_one(&pool)
        .await
        .expect("row query should succeed");

    assert_eq!(
        decode_inventory_row(row),
        Err(StorageFailure::InvalidStoredData)
    );
}
