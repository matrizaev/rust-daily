#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Currency {
    Usd,
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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoneyParseError {
    InvalidFormat,
}

impl TryFrom<&str> for Money {
    type Error = MoneyParseError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(MoneyParseError::InvalidFormat);
        }
        let mut parts = value.split('.');
        let main_str = parts.next().ok_or(MoneyParseError::InvalidFormat)?;
        let main = main_str.parse::<u64>().map_err(|_| MoneyParseError::InvalidFormat)?;
        
        let cents = match parts.next() {
            None => 0,
            Some(cents_str) => {
                if cents_str.is_empty() || cents_str.len() > 2 {
                    return Err(MoneyParseError::InvalidFormat);
                }
                let mut c = cents_str.parse::<u64>().map_err(|_| MoneyParseError::InvalidFormat)?;
                if cents_str.len() == 1 {
                    c *= 10;
                }
                c
            }
        };
        if parts.next().is_some() {
            return Err(MoneyParseError::InvalidFormat);
        }
        Ok(Self::new(main * 100 + cents, Currency::Usd))
    }
}
