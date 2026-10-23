use super::{InventoryObservation, PolicyRejection, ReservationCommand, ReservationIntent};

pub fn decide(
    command: &ReservationCommand,
    observation: &InventoryObservation,
) -> Result<ReservationIntent, PolicyRejection> {
    if command.item_id != observation.item_id {
        return Err(PolicyRejection::ObservationMismatch);
    }

    if command.quantity.value() > observation.available {
        return Err(PolicyRejection::InsufficientObservedInventory);
    }

    Ok(ReservationIntent {
        item_id: command.item_id,
        quantity: command.quantity,
    })
}
