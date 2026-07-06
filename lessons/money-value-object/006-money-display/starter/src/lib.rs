use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
    Gbp,
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

// TODO: Implement std::fmt::Display for Money.
