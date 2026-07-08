use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CreateOrderError {
    EmptyOrder,
    InvalidQuantity,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RepositoryError {
    Unavailable,
    Conflict,
}

impl fmt::Display for RepositoryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            RepositoryError::Unavailable => write!(f, "repository unavailable"),
            RepositoryError::Conflict => write!(f, "repository conflict"),
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    Domain(CreateOrderError),
    Repository(RepositoryError),
}

impl From<CreateOrderError> for CreateOrderUseCaseError {
    fn from(error: CreateOrderError) -> Self {
        CreateOrderUseCaseError::Domain(error)
    }
}

pub fn is_retryable(error: CreateOrderUseCaseError) -> bool {
    matches!(
        error,
        CreateOrderUseCaseError::Repository(RepositoryError::Unavailable),
    )
}

pub fn status_code(error: &CreateOrderUseCaseError) -> u16 {
    match error {
        CreateOrderUseCaseError::Domain(_) => 400,
        CreateOrderUseCaseError::Repository(RepositoryError::Conflict) => 409,
        CreateOrderUseCaseError::Repository(RepositoryError::Unavailable) => 503,
    }
}
