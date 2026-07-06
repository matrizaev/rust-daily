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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MoneyParseError {
    Empty,
    InvalidDigits,
    TooManyDecimalPlaces,
    AmountOverflow,
}

impl TryFrom<&str> for Money {
    type Error = MoneyParseError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        if value.is_empty() {
            return Err(MoneyParseError::Empty);
        }

        let (major_text, minor_text) = match value.split_once('.') {
            Some((major_text, minor_text)) => (major_text, Some(minor_text)),
            None => (value, None),
        };

        if major_text.is_empty() {
            return Err(MoneyParseError::InvalidDigits);
        }

        let major = major_text
            .parse::<u64>()
            .map_err(|_| MoneyParseError::InvalidDigits)?;
        let minor = match minor_text {
            None => 0,
            Some(text) if text.is_empty() => return Err(MoneyParseError::InvalidDigits),
            Some(text) if text.len() > 2 => {
                return Err(MoneyParseError::TooManyDecimalPlaces);
            }
            Some(text) => {
                let parsed = text
                    .parse::<u64>()
                    .map_err(|_| MoneyParseError::InvalidDigits)?;

                if text.len() == 1 {
                    parsed
                        .checked_mul(10)
                        .ok_or(MoneyParseError::AmountOverflow)?
                } else {
                    parsed
                }
            }
        };
        let amount = major
            .checked_mul(100)
            .and_then(|major_minor_units| major_minor_units.checked_add(minor))
            .ok_or(MoneyParseError::AmountOverflow)?;

        Ok(Self::new(amount, Currency::Usd))
    }
}
