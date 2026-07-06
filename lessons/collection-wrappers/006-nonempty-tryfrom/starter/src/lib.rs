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

// TODO: implement TryFrom<Vec<OrderLine>> for OrderLines.
