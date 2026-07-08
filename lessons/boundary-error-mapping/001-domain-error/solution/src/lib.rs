use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}
