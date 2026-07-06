#[derive(Debug, Clone, PartialEq, Eq)]
pub struct OrderLine {
    pub sku: String,
    pub quantity: u32,
}

// TODO: define OrderLines as a private Vec wrapper with constructor and basic accessors.
