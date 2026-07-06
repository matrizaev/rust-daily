pub struct Item {
    pub name: String,
    pub quantity: u32,
}

pub fn sort_by_name(items: &mut [Item]) {
    // TODO: sort by borrowed item names without cloning.
}
