#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
    Gbp,
}

impl Currency {
    pub fn code(self) -> &'static str {
        match self {
            Self::Usd => "USD",
            Self::Eur => "EUR",
            Self::Gbp => "GBP",
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money {
    amount: u64,
    currency: Currency,
}

impl Money {
    pub fn new(amount: u64, currency: Currency) -> Self {
        Self { amount, currency }
    }

    pub fn amount(&self) -> u64 {
        self.amount
    }

    pub fn currency(&self) -> Currency {
        self.currency
    }
}
