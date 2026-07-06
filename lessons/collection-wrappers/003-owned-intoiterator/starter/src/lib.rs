#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

pub struct OrderLines {
    lines: Vec<OrderLine>,
}

impl OrderLines {
    pub fn new(lines: Vec<OrderLine>) -> Self { Self { lines } }
}

// TODO: implement IntoIterator for OrderLines.
