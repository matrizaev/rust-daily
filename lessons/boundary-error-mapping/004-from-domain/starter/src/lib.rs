#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CreateOrderError {
    EmptyOrder,
    InvalidQuantity,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CreateOrderUseCaseError {
    Domain(CreateOrderError),
}

// TODO: implement From<CreateOrderError> for CreateOrderUseCaseError.
