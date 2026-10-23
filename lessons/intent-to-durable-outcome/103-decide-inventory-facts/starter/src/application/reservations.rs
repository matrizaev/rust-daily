use crate::{
    application::{ReservationError, ReservationRepository},
    domain::ReservationCommand,
};

pub async fn reserve(
    repository: &impl ReservationRepository,
    command: ReservationCommand,
) -> Result<crate::application::ReservationReceipt, ReservationError> {
    let _ = (repository, command);
    todo!("orchestrate observe, decide, and commit")
}
