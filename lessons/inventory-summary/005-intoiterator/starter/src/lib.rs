#[derive(Debug, Clone, PartialEq, Eq)]
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

pub fn total_quantity(items: &[Item]) -> u32 {
    items.iter().fold(0, |total, item| total + item.quantity)
}

pub fn priority_restock_notes(notes: &[String]) -> Vec<String> {
    let mut priority_notes = Vec::new();

    for note in notes {
        let normalized = note.trim().to_lowercase();
        if normalized.is_empty() {
            continue;
        }

        let mentions_urgent = normalized.contains("urgent");
        let mentions_stock = normalized.contains("stock");
        let is_restock_alert = mentions_urgent || mentions_stock;

        if is_restock_alert {
            priority_notes.push(normalized);
        }
    }

    priority_notes
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Inventory {
    items: Vec<Item>,
}

impl Inventory {
    pub fn new(items: Vec<Item>) -> Self {
        Self { items }
    }
}

// Continue from the previous lesson.
// TODO: implement IntoIterator for Inventory.
