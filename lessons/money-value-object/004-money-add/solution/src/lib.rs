use std::ops::Add;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
    Eur,
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
    pub fn amount(&self) -> u64 { self.amount }
    pub fn currency(&self) -> Currency { self.currency }
}

impl Add for Money {
    type Output = Self;

    fn add(self, rhs: Self) -> Self::Output {
        if self.currency != rhs.currency {
            panic!("Cannot add money of different currencies");
        }
        Self {
            amount: self.amount + rhs.amount,
            currency: self.currency,
        }
    }
}
