use std::num::{NonZeroI64, NonZeroU32};

pub mod policy;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ItemId(NonZeroI64);

impl ItemId {
    pub fn new(value: i64) -> Option<Self> {
        NonZeroI64::new(value).filter(|value| value.get() > 0).map(Self)
    }

    pub fn value(self) -> i64 {
        self.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Quantity(NonZeroU32);

impl Quantity {
    pub fn new(value: u32) -> Option<Self> {
        NonZeroU32::new(value).map(Self)
    }

    pub fn value(self) -> u32 {
        self.0.get()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ReservationRequest {
    pub item_id: i64,
    pub quantity: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ReservationRequestError {
    InvalidItemId,
    ZeroQuantity,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ReservationCommand {
    item_id: ItemId,
    quantity: Quantity,
}

impl ReservationCommand {
    pub fn item_id(&self) -> ItemId {
        self.item_id
    }

    pub fn quantity(&self) -> Quantity {
        self.quantity
    }
}

impl TryFrom<ReservationRequest> for ReservationCommand {
    type Error = ReservationRequestError;

    fn try_from(request: ReservationRequest) -> Result<Self, Self::Error> {
        let item_id = ItemId::new(request.item_id).ok_or(ReservationRequestError::InvalidItemId)?;
        let quantity = Quantity::new(request.quantity).ok_or(ReservationRequestError::ZeroQuantity)?;
        Ok(Self { item_id, quantity })
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct InventoryObservation {
    item_id: ItemId,
    available: u32,
}

impl InventoryObservation {
    pub fn new(item_id: ItemId, available: u32) -> Self {
        Self { item_id, available }
    }

    pub fn item_id(&self) -> ItemId {
        self.item_id
    }

    pub fn available(&self) -> u32 {
        self.available
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ReservationIntent {
    item_id: ItemId,
    quantity: Quantity,
}

impl ReservationIntent {
    pub fn item_id(&self) -> ItemId {
        self.item_id
    }

    pub fn quantity(&self) -> Quantity {
        self.quantity
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PolicyRejection {
    ObservationMismatch,
    InsufficientObservedInventory,
}
