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

impl IntoIterator for OrderLines {
    type Item = OrderLine;
    type IntoIter = std::vec::IntoIter<OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.lines.into_iter()
    }
}
