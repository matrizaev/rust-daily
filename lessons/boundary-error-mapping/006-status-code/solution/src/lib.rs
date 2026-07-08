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

impl CreateOrderUseCaseError {
    pub fn is_retryable(&self) -> bool {
        matches!(self, Self::Repository(RepositoryError::Unavailable))
    }
}

pub fn status_code(error: &CreateOrderUseCaseError) -> u16 {
    match error {
        CreateOrderUseCaseError::Domain(_) => 400,
        CreateOrderUseCaseError::Repository(RepositoryError::Conflict) => 409,
        CreateOrderUseCaseError::Repository(RepositoryError::Unavailable) => 503,
    }
}
