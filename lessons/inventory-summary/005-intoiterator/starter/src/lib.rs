pub struct Item {
    pub name: String,
}

pub struct Inventory {
    items: Vec<Item>,
}

impl Inventory {
    pub fn new(items: Vec<Item>) -> Self {
        Self { items }
    }
}

// TODO: implement IntoIterator for Inventory.
