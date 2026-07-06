#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    pub fn len(&self) -> usize { self.lines.len() }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OrderLinesError {
    Empty,
}

impl TryFrom<Vec<OrderLine>> for OrderLines {
    type Error = OrderLinesError;

    fn try_from(lines: Vec<OrderLine>) -> Result<Self, Self::Error> {
        if lines.is_empty() {
            return Err(OrderLinesError::Empty);
        }

        Ok(Self { lines })
    }
}
