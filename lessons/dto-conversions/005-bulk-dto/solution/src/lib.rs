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
            email: value.email.ok_or(RegisterUserValidationError::MissingEmail)?,
            display_name: value.display_name.ok_or(RegisterUserValidationError::MissingDisplayName)?,
        })
    }
}

pub struct BulkRegisterDto {
    pub users: Vec<RegisterUserDto>,
}

pub struct BulkRegisterCommand {
    commands: Vec<RegisterUserCommand>,
}

impl BulkRegisterCommand {
    pub fn commands(&self) -> &[RegisterUserCommand] { &self.commands }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum BulkRegisterError {
    EmptyBatch,
    InvalidUser { index: usize, error: RegisterUserValidationError },
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
