use rust_daily_lesson::{
    application::{CommitOutcome, ReservationRepository, reservations::reserve},
    domain::{ItemId, ReservationCommand, ReservationIntent, ReservationRequest, policy::decide},
    infrastructure::sqlite_repository::SqliteReservationRepository,
};
use sqlx::sqlite::{SqliteConnectOptions, SqlitePool, SqlitePoolOptions};

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

async fn seed(pool: &SqlitePool, item_id: i64, available: i64) {
    sqlx::query("INSERT INTO inventory (item_id, available) VALUES (?, ?)")
        .bind(item_id)
        .bind(available)
        .execute(pool)
        .await
        .expect("inventory seed should insert");
}

async fn available(pool: &SqlitePool, item_id: i64) -> i64 {
    sqlx::query_scalar("SELECT available FROM inventory WHERE item_id = ?")
        .bind(item_id)
        .fetch_one(pool)
        .await
        .expect("inventory row should exist")
}

async fn reservation_count(pool: &SqlitePool) -> i64 {
    sqlx::query_scalar("SELECT COUNT(*) FROM reservations")
        .fetch_one(pool)
        .await
        .expect("reservation count should query")
}

fn command(item: i64, amount: u32) -> ReservationCommand {
    ReservationCommand::try_from(ReservationRequest {
        item_id: item,
        quantity: amount,
    })
    .expect("test request should be valid")
}

fn item_id(value: i64) -> ItemId {
    ItemId::new(value).expect("test item id should be positive")
}

#[tokio::test]
async fn observation_reads_and_decodes_persisted_inventory() {
    let pool = pool().await;
    seed(&pool, 1, 5).await;
    let repository = SqliteReservationRepository::new(pool);

    let observation = repository
        .observe(item_id(1))
        .await
        .expect("database read should succeed");

    assert_eq!(observation.unwrap().available(), 5);
}

#[tokio::test]
async fn successful_commit_decrements_stock_and_inserts_receipt_row() {
    let pool = pool().await;
    seed(&pool, 1, 5).await;
    let repository = SqliteReservationRepository::new(pool.clone());

    let receipt = reserve(&repository, command(1, 3))
        .await
        .expect("reservation should commit");

    assert_eq!(receipt.reservation_id().value(), 1);
    assert_eq!(receipt.item_id(), item_id(1));
    assert_eq!(receipt.quantity().value(), 3);
    assert_eq!(available(&pool, 1).await, 2);
    assert_eq!(reservation_count(&pool).await, 1);
}

#[tokio::test]
async fn conditional_update_rejects_stale_intent_without_writes() {
    let pool = pool().await;
    seed(&pool, 1, 5).await;
    let repository = SqliteReservationRepository::new(pool.clone());
    let command = command(1, 3);
    let observation = repository
        .observe(command.item_id())
        .await
        .expect("observation should load")
        .expect("inventory row should exist");
    let intent: ReservationIntent = decide(&command, &observation).expect("initial stock is enough");
    sqlx::query("UPDATE inventory SET available = 2 WHERE item_id = 1")
        .execute(&pool)
        .await
        .expect("simulate intervening stock change");

    let outcome = repository
        .commit(intent)
        .await
        .expect("stale stock is a domain outcome, not a storage failure");

    assert_eq!(outcome, CommitOutcome::UnavailableAtCommit);
    assert_eq!(available(&pool, 1).await, 2);
    assert_eq!(reservation_count(&pool).await, 0);
}
