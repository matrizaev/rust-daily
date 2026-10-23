use rust_daily_lesson::{
    adapter::reservation_response::{
        ProblemCode, ReservationHttpResponse, ResponseBody, map_reservation_result,
    },
    application::{
        ReservationError, ReservationRepository, StorageFailure, reservations::reserve,
    },
    domain::{ItemId, PolicyRejection, ReservationCommand, ReservationRequest},
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
        .expect("inventory row should remain present")
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

fn item_id() -> ItemId {
    ItemId::new(1).expect("test item id should be positive")
}

#[tokio::test]
async fn maps_committed_receipt_to_created_response() {
    let pool = pool().await;
    seed(&pool).await;
    let repository = SqliteReservationRepository::new(pool);
    let receipt = reserve(&repository, command())
        .await
        .expect("reservation should commit");

    assert_eq!(
        map_reservation_result(Ok(receipt)),
        ReservationHttpResponse {
            status: 201,
            body: ResponseBody::Created {
                reservation_id: 1,
                item_id: 1,
                quantity: 3,
            },
        }
    );
}

#[test]
fn maps_semantic_errors_without_exposing_storage_details() {
    let cases = [
        (ReservationError::ItemNotFound, 404, ProblemCode::ItemNotFound),
        (
            ReservationError::PolicyRejected(PolicyRejection::ObservationMismatch),
            409,
            ProblemCode::ObservationMismatch,
        ),
        (
            ReservationError::PolicyRejected(
                PolicyRejection::InsufficientObservedInventory,
            ),
            409,
            ProblemCode::InsufficientObservedInventory,
        ),
        (
            ReservationError::UnavailableAtCommit,
            409,
            ProblemCode::UnavailableAtCommit,
        ),
        (
            ReservationError::Storage(StorageFailure::Database),
            500,
            ProblemCode::StorageFailure,
        ),
        (
            ReservationError::Storage(StorageFailure::InvalidStoredData),
            500,
            ProblemCode::StorageFailure,
        ),
        (
            ReservationError::Storage(StorageFailure::CommitOutcomeUnknown),
            503,
            ProblemCode::ReservationOutcomeUnknown,
        ),
    ];

    for (error, status, code) in cases {
        assert_eq!(
            map_reservation_result(Err(error)),
            ReservationHttpResponse {
                status,
                body: ResponseBody::Problem(code),
            }
        );
    }
}

fn fail_delivery(_response: ReservationHttpResponse) -> Result<(), &'static str> {
    Err("client connection closed")
}

#[tokio::test]
async fn response_delivery_failure_does_not_undo_or_replay_commit() {
    let pool = pool().await;
    seed(&pool).await;
    let repository = SqliteReservationRepository::new(pool.clone());
    let receipt = reserve(&repository, command())
        .await
        .expect("reservation should commit before response mapping");
    let response = map_reservation_result(Ok(receipt));

    assert_eq!(fail_delivery(response), Err("client connection closed"));
    assert_eq!(available(&pool).await, 2);
    assert_eq!(reservation_count(&pool).await, 1);
    assert!(repository.observe(item_id()).await.unwrap().is_some());
}
