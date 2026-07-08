pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub fn total_quantity(items: &[Item]) -> u32 {
    items.iter().fold(0, |total, item| total + item.quantity)
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

pub fn reorder_notes(notes: &[String]) -> Vec<String> {
    notes
        .iter()
        .map(|note| note.trim().to_lowercase())
        .filter(|note| !note.is_empty())
        .filter(|note| note.contains("urgent") || note.contains("stock"))
        .collect()
}

// Continue from the previous lesson.
// TODO: refactor reorder_notes so the inventory priority rule is easy to scan.
