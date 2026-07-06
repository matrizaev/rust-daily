#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CreateOrderError {
    EmptyOrder,
    InvalidQuantity,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    Domain(CreateOrderError),
}

impl From<CreateOrderError> for CreateOrderUseCaseError {
    fn from(error: CreateOrderError) -> Self {
        CreateOrderUseCaseError::Domain(error)
    }
}
