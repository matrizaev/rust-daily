#[derive(Debug, Clone, PartialEq, Eq)]
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
    pub fn email(&self) -> &str { &self.email }
    pub fn display_name(&self) -> &str { &self.display_name }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegisterUserValidationError {
    MissingEmail,
    MissingDisplayName,
    EmptyEmail,
    EmptyDisplayName,
}

impl TryFrom<RegisterUserDto> for RegisterUserCommand {
    type Error = RegisterUserValidationError;

    fn try_from(value: RegisterUserDto) -> Result<Self, Self::Error> {
        let email = value.email.ok_or(RegisterUserValidationError::MissingEmail)?;
        let display_name = value
            .display_name
            .ok_or(RegisterUserValidationError::MissingDisplayName)?;
        let email = email.trim();
        let display_name = display_name.trim();

        if email.is_empty() {
            return Err(RegisterUserValidationError::EmptyEmail);
        }
        if display_name.is_empty() {
            return Err(RegisterUserValidationError::EmptyDisplayName);
        }

        Ok(Self {
            email: email.to_owned(),
            display_name: display_name.to_owned(),
        })
    }
}

// Continue from the previous lesson.
// TODO: implement TryFrom<BulkRegisterDto> for BulkRegisterCommand.
