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

pub fn handle_register_user<U: RegisterUserUseCase>(use_case: &mut U, request: RegisterUserRequest) -> Response {
    let command = match RegisterUserCommand::try_from(request) {
        Ok(command) => command,
        Err(RegisterUserError::InvalidRequest) => return Response { status: 400 },
        Err(RegisterUserError::DuplicateEmail | RegisterUserError::RepositoryUnavailable) => return Response { status: 500 },
    };

    match use_case.register_user(command) {
        Ok(_) => Response { status: 201 },
        Err(RegisterUserError::DuplicateEmail) => Response { status: 409 },
        Err(RegisterUserError::RepositoryUnavailable) => Response { status: 503 },
        Err(RegisterUserError::InvalidRequest) => Response { status: 400 },
    }
}
