#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserRequest { pub email: String, pub display_name: String }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct RegisterUserCommand { pub email: String, pub display_name: String }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct UserId(pub u64);
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegisterUserError { InvalidRequest, DuplicateEmail, RepositoryUnavailable }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Response { pub status: u16 }

pub trait RegisterUserUseCase {
    fn register_user(&mut self, command: RegisterUserCommand) -> Result<UserId, RegisterUserError>;
}

impl TryFrom<RegisterUserRequest> for RegisterUserCommand {
    type Error = RegisterUserError;
    fn try_from(value: RegisterUserRequest) -> Result<Self, Self::Error> {
        if value.email.trim().is_empty() { return Err(RegisterUserError::InvalidRequest); }
        Ok(Self { email: value.email, display_name: value.display_name })
    }
}

// TODO: implement handle_register_user.
