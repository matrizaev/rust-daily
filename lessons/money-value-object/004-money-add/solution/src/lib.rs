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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoneyAddError {
    CurrencyMismatch { left: Currency, right: Currency },
    AmountOverflow,
}

impl Money {
    pub fn checked_add(self, rhs: Self) -> Result<Self, MoneyAddError> {
        if self.currency != rhs.currency {
            return Err(MoneyAddError::CurrencyMismatch {
                left: self.currency,
                right: rhs.currency,
            });
        }

        let amount = self
            .amount
            .checked_add(rhs.amount)
            .ok_or(MoneyAddError::AmountOverflow)?;

        Ok(Self {
            amount,
            currency: self.currency,
        })
    }
}
