use serde::Deserialize;

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserDto {
    pub email: Option<String>,
    pub display_name: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand {
    email: String,
    display_name: String,
}

impl RegisterUserCommand {
    pub fn new(email: impl Into<String>, display_name: impl Into<String>) -> Self {
        Self {
            email: email.into(),
            display_name: display_name.into(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegisterUserValidationError {
    MissingEmail,
    MissingDisplayName,
}

impl TryFrom<RegisterUserDto> for RegisterUserCommand {
    type Error = RegisterUserValidationError;

    fn try_from(value: RegisterUserDto) -> Result<Self, Self::Error> {
        Ok(Self {
            email: value
                .email
                .ok_or(RegisterUserValidationError::MissingEmail)?,
            display_name: value
                .display_name
                .ok_or(RegisterUserValidationError::MissingDisplayName)?,
        })
    }
}

// TODO: trim fields and reject empty values.
