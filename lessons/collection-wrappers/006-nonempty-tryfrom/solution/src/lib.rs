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

impl OrderLines {
    pub fn iter_mut(&mut self) -> std::slice::IterMut<'_, OrderLine> {
        self.lines.iter_mut()
    }
}

impl<'a> IntoIterator for &'a mut OrderLines {
    type Item = &'a mut OrderLine;
    type IntoIter = std::slice::IterMut<'a, OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.iter_mut()
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum OrderLinesError {
    Empty,
}

impl OrderLines {
    pub fn drain(&mut self) -> std::vec::Drain<'_, OrderLine> {
        self.lines.drain(..)
    }
}

impl TryFrom<Vec<OrderLine>> for OrderLines {
    type Error = OrderLinesError;

    fn try_from(lines: Vec<OrderLine>) -> Result<Self, Self::Error> {
        if lines.is_empty() {
            return Err(OrderLinesError::Empty);
        }

        Ok(Self::new(lines))
    }
}
