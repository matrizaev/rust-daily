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

    pub fn as_slice(&self) -> &[OrderLine] {
        &self.lines
    }
}

impl OrderLines {
    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
        self.lines.iter()
    }
}
