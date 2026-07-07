use std::error::Error;
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CreateOrderError {
    EmptyOrder,
    InvalidQuantity,
}

impl fmt::Display for CreateOrderError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CreateOrderError::EmptyOrder => write!(f, "empty order"),
            CreateOrderError::InvalidQuantity => write!(f, "invalid quantity"),
        }
    }
}

impl Error for CreateOrderError {}

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

impl Error for RepositoryError {}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    Domain(CreateOrderError),
    Repository(RepositoryError),
}

impl fmt::Display for CreateOrderUseCaseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            CreateOrderUseCaseError::Domain(error) => write!(f, "domain error: {error}"),
            CreateOrderUseCaseError::Repository(error) => write!(f, "repository error: {error}"),
        }
    }
}

impl Error for CreateOrderUseCaseError {
    fn source(&self) -> Option<&(dyn Error + 'static)> {
        match self {
            CreateOrderUseCaseError::Domain(error) => Some(error),
            CreateOrderUseCaseError::Repository(error) => Some(error),
        }
    }
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
