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

#[non_exhaustive]
#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    #[error(transparent)]
    Domain(#[from] CreateOrderError),
    #[error(transparent)]
    Repository(#[from] RepositoryError),
}

// TODO: add is_retryable to the use-case error.
