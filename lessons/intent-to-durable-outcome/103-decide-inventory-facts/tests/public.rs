use rust_daily_lesson::domain::{
    InventoryObservation, ItemId, PolicyRejection, Quantity, ReservationCommand,
    ReservationRequest, policy::decide,
};

fn command(item_id: i64, quantity: u32) -> ReservationCommand {
    ReservationCommand::try_from(ReservationRequest { item_id, quantity })
        .expect("test request should be valid")
}

fn item_id(value: i64) -> ItemId {
    ItemId::new(value).expect("test item id should be positive")
}

fn quantity(value: u32) -> Quantity {
    Quantity::new(value).expect("test quantity should be positive")
}

#[test]
fn accepts_matching_observation_with_sufficient_stock() {
    let command = command(1, 3);
    let observation = InventoryObservation::new(item_id(1), 5);

    let intent = decide(&command, &observation).expect("policy should accept request");

    assert_eq!(intent.item_id(), item_id(1));
    assert_eq!(intent.quantity(), quantity(3));
}

#[test]
fn rejects_an_observation_for_another_item() {
    let command = command(1, 3);
    let observation = InventoryObservation::new(item_id(2), 5);

    assert_eq!(
        decide(&command, &observation),
        Err(PolicyRejection::ObservationMismatch)
    );
}

#[test]
fn rejects_quantity_above_observed_stock() {
    let command = command(1, 6);
    let observation = InventoryObservation::new(item_id(1), 5);

    assert_eq!(
        decide(&command, &observation),
        Err(PolicyRejection::InsufficientObservedInventory)
    );
}

#[test]
fn policy_leaves_command_and_observation_unchanged() {
    let command = command(1, 3);
    let observation = InventoryObservation::new(item_id(1), 5);
    let original_command = command;
    let original_observation = observation;

    let _ = decide(&command, &observation);

    assert_eq!(command, original_command);
    assert_eq!(observation, original_observation);
}
