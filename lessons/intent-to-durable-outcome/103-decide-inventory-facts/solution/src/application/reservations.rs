use crate::{
    application::{
        CommitOutcome, ReservationError, ReservationRepository,
    },
    domain::{ReservationCommand, policy::decide},
};

pub async fn reserve(
    repository: &impl ReservationRepository,
    command: ReservationCommand,
) -> Result<crate::application::ReservationReceipt, ReservationError> {
    let observation = repository
        .observe(command.item_id())
        .await
        .map_err(ReservationError::Storage)?
        .ok_or(ReservationError::ItemNotFound)?;
    let intent = decide(&command, &observation).map_err(ReservationError::PolicyRejected)?;

    match repository
        .commit(intent)
        .await
        .map_err(ReservationError::Storage)?
    {
        CommitOutcome::Committed(receipt) => Ok(receipt),
        CommitOutcome::UnavailableAtCommit => Err(ReservationError::UnavailableAtCommit),
    }
}
