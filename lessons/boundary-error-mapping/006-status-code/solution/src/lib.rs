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

pub fn status_code(error: &CreateOrderUseCaseError) -> u16 {
    match error {
        CreateOrderUseCaseError::Domain(_) => 400,
        CreateOrderUseCaseError::Repository(RepositoryError::Conflict) => 409,
        CreateOrderUseCaseError::Repository(RepositoryError::Unavailable) => 503,
    }
}
