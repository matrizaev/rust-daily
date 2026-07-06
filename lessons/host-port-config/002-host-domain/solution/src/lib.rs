#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Host(String);

impl Host { 
    pub fn new_unchecked(val: String) -> Self {
        Self(val)
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}
