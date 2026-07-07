pub mod domain {
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct EmailAddress(String);

    impl EmailAddress {
        pub fn new(value: impl Into<String>) -> Self {
            Self(value.into())
        }

        pub fn as_str(&self) -> &str {
            &self.0
        }
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct UserId(pub u64);

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct RegisterUserCommand {
        email: EmailAddress,
        display_name: String,
    }

    impl RegisterUserCommand {
        pub fn new(email: EmailAddress, display_name: impl Into<String>) -> Self {
            Self {
                email,
                display_name: display_name.into(),
            }
        }

        pub fn email(&self) -> &EmailAddress {
            &self.email
        }

        pub fn display_name(&self) -> &str {
            &self.display_name
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct NewUser {
        pub email: EmailAddress,
        pub display_name: String,
    }

    impl From<RegisterUserCommand> for NewUser {
        fn from(command: RegisterUserCommand) -> Self {
            Self {
                email: command.email,
                display_name: command.display_name,
            }
        }
    }
}

pub mod application {
    use super::domain::{NewUser, RegisterUserCommand, UserId};

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum RegisterUserError {
        InvalidRequest,
        DuplicateEmail,
        RepositoryUnavailable,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum RepositoryError {
        Unavailable,
    }

    pub trait RegisterUserUseCase {
        fn register_user(
            &mut self,
            command: RegisterUserCommand,
        ) -> Result<UserId, RegisterUserError>;
    }

    pub trait UserRepository {
        fn exists_by_email(
            &self,
            email: &super::domain::EmailAddress,
        ) -> Result<bool, RepositoryError>;

        fn save(&mut self, user: NewUser) -> Result<UserId, RepositoryError>;
    }

    pub fn register_user<R: UserRepository>(
        repository: &mut R,
        command: RegisterUserCommand,
    ) -> Result<UserId, RegisterUserError> {
        if repository
            .exists_by_email(command.email())
            .map_err(|_| RegisterUserError::RepositoryUnavailable)?
        {
            return Err(RegisterUserError::DuplicateEmail);
        }

        repository
            .save(NewUser::from(command))
            .map_err(|_| RegisterUserError::RepositoryUnavailable)
    }
}

pub mod adapters {
    use super::application::{RegisterUserError, RegisterUserUseCase};
    use super::domain::{EmailAddress, RegisterUserCommand};

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct RegisterUserRequest {
        pub email: String,
        pub display_name: String,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct Response {
        pub status: u16,
    }

    impl TryFrom<RegisterUserRequest> for RegisterUserCommand {
        type Error = RegisterUserError;

        fn try_from(value: RegisterUserRequest) -> Result<Self, Self::Error> {
            let email = value.email.trim();
            let display_name = value.display_name.trim();

            if email.is_empty() || display_name.is_empty() {
                return Err(RegisterUserError::InvalidRequest);
            }

            Ok(RegisterUserCommand::new(
                EmailAddress::new(email.to_owned()),
                display_name.to_owned(),
            ))
        }
    }

    pub fn handle_register_user<U: RegisterUserUseCase>(
        use_case: &mut U,
        request: RegisterUserRequest,
    ) -> Response {
        let command = match RegisterUserCommand::try_from(request) {
            Ok(command) => command,
            Err(RegisterUserError::InvalidRequest) => return Response { status: 400 },
            Err(RegisterUserError::DuplicateEmail | RegisterUserError::RepositoryUnavailable) => {
                return Response { status: 500 };
            }
        };

        match use_case.register_user(command) {
            Ok(_) => Response { status: 201 },
            Err(RegisterUserError::InvalidRequest) => Response { status: 400 },
            Err(RegisterUserError::DuplicateEmail) => Response { status: 409 },
            Err(RegisterUserError::RepositoryUnavailable) => Response { status: 503 },
        }
    }
}

pub mod infrastructure {
    use super::application::{RepositoryError, UserRepository};
    use super::domain::{EmailAddress, NewUser, UserId};

    #[derive(Debug, Default)]
    pub struct InMemoryUserRepository {
        users: Vec<NewUser>,
        next_id: u64,
    }

    impl InMemoryUserRepository {
        pub fn new() -> Self {
            Self {
                users: Vec::new(),
                next_id: 1,
            }
        }
    }

    impl UserRepository for InMemoryUserRepository {
        fn exists_by_email(&self, email: &EmailAddress) -> Result<bool, RepositoryError> {
            Ok(self.users.iter().any(|user| &user.email == email))
        }

        fn save(&mut self, user: NewUser) -> Result<UserId, RepositoryError> {
            let id = UserId(self.next_id);
            self.next_id += 1;
            self.users.push(user);
            Ok(id)
        }
    }
}

pub use adapters::{handle_register_user, RegisterUserRequest, Response};
pub use application::{RegisterUserError, RegisterUserUseCase};
pub use domain::{RegisterUserCommand, UserId};
