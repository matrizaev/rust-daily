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

impl<'a> IntoIterator for &'a OrderLines {
    type Item = &'a OrderLine;
    type IntoIter = std::slice::Iter<'a, OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.lines.iter()
    }
}


impl OrderLines {
    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
            self.lines.iter()
        }
}
