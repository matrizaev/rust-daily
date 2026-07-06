pub struct Item {
    pub quantity: u32,
}

pub fn total_quantity(items: &[Item]) -> u32 {
    items.iter().fold(0, |total, item| total + item.quantity)
}
