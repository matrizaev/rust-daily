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
    pub fn new(lines: Vec<OrderLine>) -> Self {
        Self { lines }
    }

    pub fn len(&self) -> usize {
        self.lines.len()
    }

    pub fn is_empty(&self) -> bool {
        self.lines.is_empty()
    }

    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
        self.lines.iter()
    }
}

impl IntoIterator for OrderLines {
    type Item = OrderLine;
    type IntoIter = std::vec::IntoIter<OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.lines.into_iter()
    }
}

impl<'a> IntoIterator for &'a OrderLines {
    type Item = &'a OrderLine;
    type IntoIter = std::slice::Iter<'a, OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter()
    }
}
