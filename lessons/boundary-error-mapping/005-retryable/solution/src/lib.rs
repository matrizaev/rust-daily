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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    Domain(CreateOrderError),
    Repository(RepositoryError),
}

pub fn is_retryable(error: CreateOrderUseCaseError) -> bool {
    matches!(
        error,
        CreateOrderUseCaseError::Repository(RepositoryError::Unavailable)
    )
}


impl fmt::Display for RepositoryError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            RepositoryError::Unavailable => write!(f, "repository unavailable"),
            RepositoryError::Conflict => write!(f, "repository conflict"),
        }
    }
}


impl From<CreateOrderError> for CreateOrderUseCaseError {
    fn from(error: CreateOrderError) -> Self {
        CreateOrderUseCaseError::Domain(error)
    }
}
