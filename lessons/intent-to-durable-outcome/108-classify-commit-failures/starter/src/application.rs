use std::{future::Future, num::NonZeroI64};

use crate::domain::{
    InventoryObservation, ItemId, PolicyRejection, Quantity, ReservationIntent,
};

pub mod reservations;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ReservationId(NonZeroI64);

impl ReservationId {
    pub fn new(value: i64) -> Option<Self> {
        NonZeroI64::new(value).filter(|value| value.get() > 0).map(Self)
    }

    pub fn value(self) -> i64 {
        self.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ReservationReceipt {
    reservation_id: ReservationId,
    item_id: ItemId,
    quantity: Quantity,
}

impl ReservationReceipt {
    pub fn new(
        reservation_id: ReservationId,
        item_id: ItemId,
        quantity: Quantity,
    ) -> Self {
        Self {
            reservation_id,
            item_id,
            quantity,
        }
    }

    pub fn reservation_id(&self) -> ReservationId {
        self.reservation_id
    }

    pub fn item_id(&self) -> ItemId {
        self.item_id
    }

    pub fn quantity(&self) -> Quantity {
        self.quantity
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StorageFailure {
    Database,
    InvalidStoredData,
    CommitOutcomeUnknown,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CommitOutcome {
    Committed(ReservationReceipt),
    UnavailableAtCommit,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReservationError {
    ItemNotFound,
    PolicyRejected(PolicyRejection),
    UnavailableAtCommit,
    Storage(StorageFailure),
}

pub trait ReservationRepository: Send + Sync {
    fn observe(
        &self,
        item_id: ItemId,
    ) -> impl Future<Output = Result<Option<InventoryObservation>, StorageFailure>> + Send;

    fn commit(
        &self,
        intent: ReservationIntent,
    ) -> impl Future<Output = Result<CommitOutcome, StorageFailure>> + Send;
}
