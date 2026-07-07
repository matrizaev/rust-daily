#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

// Continue from the previous lesson.
// TODO: use filter_map to collect names with available stock.
