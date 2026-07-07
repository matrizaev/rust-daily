pub struct Item {
    pub sku: String,
    pub name: String,
    pub quantity: u32,
    pub reserved: u32,
}

pub struct Inventory {
    items: Vec<Item>,
}

impl Inventory {
    pub fn new(items: Vec<Item>) -> Self {
        Self { items }
    }
}

impl IntoIterator for Inventory {
    type Item = Item;
    type IntoIter = std::vec::IntoIter<Item>;

    fn into_iter(self) -> Self::IntoIter {
        self.items.into_iter()
    }
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


pub fn reorder_notes(notes: &[String]) -> Vec<String> {
    let mut relevant_notes = Vec::new();

    for note in notes {
        let normalized = note.trim().to_lowercase();
        if normalized.is_empty() {
            continue;
        }

        let is_inventory_note =
            normalized.contains("urgent") || normalized.contains("stock");
        if is_inventory_note {
            relevant_notes.push(normalized);
        }
    }

    relevant_notes
}
