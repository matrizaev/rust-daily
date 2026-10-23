use rust_daily_lesson::{
    application::{
        ReservationError, StorageFailure, reservations::reserve,
    },
    domain::{ReservationCommand, ReservationRequest},
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

async fn seed(pool: &SqlitePool) {
    sqlx::query("INSERT INTO inventory (item_id, available) VALUES (1, 5)")
        .execute(pool)
        .await
        .expect("inventory seed should insert");
}

async fn available(pool: &SqlitePool) -> i64 {
    sqlx::query_scalar("SELECT available FROM inventory WHERE item_id = 1")
        .fetch_one(pool)
        .await
        .expect("inventory should remain present")
}

async fn reservation_count(pool: &SqlitePool) -> i64 {
    sqlx::query_scalar("SELECT COUNT(*) FROM reservations")
        .fetch_one(pool)
        .await
        .expect("reservation count should query")
}

fn command() -> ReservationCommand {
    ReservationCommand::try_from(ReservationRequest {
        item_id: 1,
        quantity: 3,
    })
    .expect("test request should be valid")
}

#[tokio::test]
async fn statement_failure_rolls_back_stock_and_maps_to_database_error() {
    let pool = pool().await;
    seed(&pool).await;
    sqlx::query(
        "CREATE TRIGGER reject_reservation BEFORE INSERT ON reservations \
         BEGIN SELECT RAISE(ABORT, 'injected insert failure'); END",
    )
    .execute(&pool)
    .await
    .expect("failure trigger should install");
    let repository = SqliteReservationRepository::new(pool.clone());

    let result = reserve(&repository, command()).await;

    assert_eq!(
        result,
        Err(ReservationError::Storage(StorageFailure::Database))
    );
    assert_eq!(available(&pool).await, 5);
    assert_eq!(reservation_count(&pool).await, 0);
}

#[tokio::test]
async fn deferred_commit_failure_is_unknown_and_not_retried() {
    let pool = pool().await;
    seed(&pool).await;
    sqlx::query(
        "CREATE TRIGGER inject_deferred_foreign_key_failure \
         AFTER INSERT ON reservations \
         BEGIN INSERT INTO reservations (item_id, quantity) VALUES (999, 1); END",
    )
    .execute(&pool)
    .await
    .expect("deferred constraint trigger should install");
    let repository = SqliteReservationRepository::new(pool.clone());

    let result = reserve(&repository, command()).await;

    assert_eq!(
        result,
        Err(ReservationError::Storage(
            StorageFailure::CommitOutcomeUnknown
        ))
    );
    // Unknown outcome: do not infer commit or rollback.
}
