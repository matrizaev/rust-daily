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
