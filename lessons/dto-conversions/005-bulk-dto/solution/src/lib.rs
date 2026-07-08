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
    EmptyEmail,
    EmptyDisplayName,
}

impl TryFrom<RegisterUserDto> for RegisterUserCommand {
    type Error = RegisterUserValidationError;

    fn try_from(value: RegisterUserDto) -> Result<Self, Self::Error> {
        let email = value
            .email
            .ok_or(RegisterUserValidationError::MissingEmail)?;
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

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct BulkRegisterDto {
    pub users: Vec<RegisterUserDto>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BulkRegisterCommand {
    commands: Vec<RegisterUserCommand>,
}

impl BulkRegisterCommand {
    pub fn commands(&self) -> &[RegisterUserCommand] {
        &self.commands
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BulkRegisterError {
    EmptyBatch,
    InvalidUser {
        index: usize,
        error: RegisterUserValidationError,
    },
}

impl TryFrom<BulkRegisterDto> for BulkRegisterCommand {
    type Error = BulkRegisterError;

    fn try_from(value: BulkRegisterDto) -> Result<Self, Self::Error> {
        if value.users.is_empty() {
            return Err(BulkRegisterError::EmptyBatch);
        }

        let mut commands = Vec::with_capacity(value.users.len());
        for (index, dto) in value.users.into_iter().enumerate() {
            let command = RegisterUserCommand::try_from(dto)
                .map_err(|error| BulkRegisterError::InvalidUser { index, error })?;
            commands.push(command);
        }

        Ok(Self { commands })
    }
}
