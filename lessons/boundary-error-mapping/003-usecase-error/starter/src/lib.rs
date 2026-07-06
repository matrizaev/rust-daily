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

// TODO: define CreateOrderUseCaseError.
