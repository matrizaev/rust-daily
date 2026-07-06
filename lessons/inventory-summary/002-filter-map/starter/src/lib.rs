pub struct Item {
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub fn available_names(items: &[Item]) -> Vec<&str> {
    // TODO: use filter_map to collect names with available stock.
    Vec::new()
}
