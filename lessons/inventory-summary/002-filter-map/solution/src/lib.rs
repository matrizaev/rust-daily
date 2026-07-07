pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub fn available_names(items: &[Item]) -> Vec<&str> {
    items
        .iter()
        .filter_map(|item| {
            if item.quantity > item.reserved {
                Some(item.name.as_str())
            } else {
                None
            }
        })
        .collect()
}
