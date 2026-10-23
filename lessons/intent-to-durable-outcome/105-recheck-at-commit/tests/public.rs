use rust_daily_lesson::{
    application::{ReservationError, reservations::reserve},
    domain::{ItemId, Quantity, ReservationCommand, ReservationRequest},
    infrastructure::controlled_repository::ControlledRepository,
};

fn item_id(value: i64) -> ItemId {
    ItemId::new(value).expect("test item id should be positive")
}

fn command(item: i64, amount: u32) -> ReservationCommand {
    ReservationCommand::try_from(ReservationRequest {
        item_id: item,
        quantity: amount,
    })
    .expect("test request should be valid")
}

#[tokio::test]
async fn commit_uses_current_stock_and_returns_receipt() {
    let repository = ControlledRepository::new(item_id(1), 5, 4);

    let receipt = reserve(&repository, command(1, 3))
        .await
        .expect("current stock should cover request");

    assert_eq!(receipt.reservation_id().value(), 1);
    assert_eq!(receipt.item_id(), item_id(1));
    assert_eq!(receipt.quantity(), Quantity::new(3).expect("positive quantity"));
    assert_eq!(repository.current_available(), 1);
    assert_eq!(repository.commit_calls(), 1);
}

#[tokio::test]
async fn stale_observation_does_not_authorize_commit() {
    let repository = ControlledRepository::new(item_id(1), 5, 2);

    let result = reserve(&repository, command(1, 3)).await;

    assert_eq!(result, Err(ReservationError::UnavailableAtCommit));
    assert_eq!(repository.current_available(), 2);
    assert_eq!(repository.commit_calls(), 1);
}

#[tokio::test]
async fn missing_item_never_attempts_commit() {
    let repository = ControlledRepository::new(item_id(2), 4, 4);

    let result = reserve(&repository, command(1, 1)).await;

    assert_eq!(result, Err(ReservationError::ItemNotFound));
    assert_eq!(repository.current_available(), 4);
    assert_eq!(repository.commit_calls(), 0);
}
