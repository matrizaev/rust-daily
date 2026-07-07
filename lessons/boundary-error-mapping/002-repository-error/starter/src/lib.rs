#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum CreateOrderError {
    EmptyOrder,
    InvalidQuantity,
}

// Continue from the previous lesson.
// TODO: add repository failure variants.
// TODO: implement Display for RepositoryError.
