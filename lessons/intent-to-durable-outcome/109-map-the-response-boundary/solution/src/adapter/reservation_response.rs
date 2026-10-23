use crate::{
    application::{ReservationError, ReservationReceipt, StorageFailure},
    domain::PolicyRejection,
};

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
    match result {
        Ok(receipt) => ReservationHttpResponse {
            status: 201,
            body: ResponseBody::Created {
                reservation_id: receipt.reservation_id().value(),
                item_id: receipt.item_id().value(),
                quantity: receipt.quantity().value(),
            },
        },
        Err(ReservationError::ItemNotFound) => problem(404, ProblemCode::ItemNotFound),
        Err(ReservationError::PolicyRejected(PolicyRejection::ObservationMismatch)) => {
            problem(409, ProblemCode::ObservationMismatch)
        }
        Err(ReservationError::PolicyRejected(
            PolicyRejection::InsufficientObservedInventory,
        )) => problem(409, ProblemCode::InsufficientObservedInventory),
        Err(ReservationError::UnavailableAtCommit) => {
            problem(409, ProblemCode::UnavailableAtCommit)
        }
        Err(ReservationError::Storage(StorageFailure::Database | StorageFailure::InvalidStoredData)) => {
            problem(500, ProblemCode::StorageFailure)
        }
        Err(ReservationError::Storage(StorageFailure::CommitOutcomeUnknown)) => {
            problem(503, ProblemCode::ReservationOutcomeUnknown)
        }
    }
}

fn problem(status: u16, code: ProblemCode) -> ReservationHttpResponse {
    ReservationHttpResponse {
        status,
        body: ResponseBody::Problem(code),
    }
}
