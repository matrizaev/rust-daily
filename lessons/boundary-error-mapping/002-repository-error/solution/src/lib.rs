use thiserror::Error;

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderError {
    #[error("order must contain at least one line")]
    EmptyOrder,
    #[error("order line quantity must be positive")]
    InvalidQuantity,
}

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("order conflicts with existing data")]
    Conflict,
}
