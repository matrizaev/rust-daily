pub struct Item {
    pub name: String,
    pub quantity: u32,
}

pub fn sort_by_name(items: &mut [Item]) {
    items.sort_by(|left, right| left.name.cmp(&right.name));
}
