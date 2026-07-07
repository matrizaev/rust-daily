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

impl<'a> IntoIterator for &'a mut OrderLines {
    type Item = &'a mut OrderLine;
    type IntoIter = std::slice::IterMut<'a, OrderLine>;

    fn into_iter(self) -> Self::IntoIter {
        self.lines.iter_mut()
    }
}


impl OrderLines {
    pub fn iter(&self) -> std::slice::Iter<'_, OrderLine> {
            self.lines.iter()
        }
}

// Continue from the previous lesson.
// TODO: implement TryFrom<Vec<OrderLine>> for OrderLines.
