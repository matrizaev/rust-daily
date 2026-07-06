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

// TODO: implement TryFrom<BulkRegisterDto> for BulkRegisterCommand.
