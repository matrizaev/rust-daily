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

    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
        self.lines.iter()
    }
}

// Continue from the previous lesson.
// TODO: implement IntoIterator for OrderLines.
