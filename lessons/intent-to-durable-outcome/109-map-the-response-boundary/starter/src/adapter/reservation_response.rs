use crate::application::{ReservationError, ReservationReceipt};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ReservationHttpResponse {
    pub status: u16,
    pub body: ResponseBody,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResponseBody {
    Created {
        reservation_id: i64,
        item_id: i64,
        quantity: u32,
    },
    Problem(ProblemCode),
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProblemCode {
    ItemNotFound,
    ObservationMismatch,
    InsufficientObservedInventory,
    UnavailableAtCommit,
    StorageFailure,
    ReservationOutcomeUnknown,
}

pub fn map_reservation_result(
    result: Result<ReservationReceipt, ReservationError>,
) -> ReservationHttpResponse {
    let _ = result;
    todo!("map committed outcomes and semantic failures to HTTP response values")
}
