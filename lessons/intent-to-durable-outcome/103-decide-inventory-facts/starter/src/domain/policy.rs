use super::{InventoryObservation, PolicyRejection, ReservationCommand, ReservationIntent};

pub fn decide(
    command: &ReservationCommand,
    observation: &InventoryObservation,
) -> Result<ReservationIntent, PolicyRejection> {
    todo!("decide from immutable inventory facts")
}
