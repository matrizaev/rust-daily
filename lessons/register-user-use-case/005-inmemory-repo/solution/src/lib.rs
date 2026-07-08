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

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct UserId(pub u64);

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct NewUser {
        email: EmailAddress,
        display_name: String,
    }

    impl NewUser {
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
}

pub mod application {
    use super::domain::{EmailAddress, NewUser, RegisterUserCommand, UserId};

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum RepositoryError {
        Unavailable,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum RegisterUserError {
        DuplicateEmail,
        Repository(RepositoryError),
    }

    pub trait UserRepository {
        fn exists_by_email(&self, email: &EmailAddress) -> Result<bool, RepositoryError>;

        fn save(&mut self, user: NewUser) -> Result<UserId, RepositoryError>;
    }

    pub fn register_user<R: UserRepository>(
        repository: &mut R,
        command: RegisterUserCommand,
    ) -> Result<UserId, RegisterUserError> {
        if repository
            .exists_by_email(command.email())
            .map_err(RegisterUserError::Repository)?
        {
            return Err(RegisterUserError::DuplicateEmail);
        }

        repository
            .save(NewUser::new(
                command.email().clone(),
                command.display_name().to_owned(),
            ))
            .map_err(RegisterUserError::Repository)
    }
}

pub mod adapters {
    use super::domain::{EmailAddress, RegisterUserCommand};

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct RegisterUserRequest {
        pub email: String,
        pub display_name: String,
    }

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum RequestError {
        EmptyEmail,
        EmptyDisplayName,
    }

    impl TryFrom<RegisterUserRequest> for RegisterUserCommand {
        type Error = RequestError;

        fn try_from(value: RegisterUserRequest) -> Result<Self, Self::Error> {
            let email = value.email.trim();
            let display_name = value.display_name.trim();

            if email.is_empty() {
                return Err(RequestError::EmptyEmail);
            }

            if display_name.is_empty() {
                return Err(RequestError::EmptyDisplayName);
            }

            Ok(RegisterUserCommand::new(
                EmailAddress::new(email.to_owned()),
                display_name.to_owned(),
            ))
        }
    }
}

pub mod infrastructure {
    use super::application::{RepositoryError, UserRepository};
    use super::domain::{EmailAddress, NewUser, UserId};

    #[derive(Debug)]
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
            Ok(self.users.iter().any(|user| user.email() == email))
        }

        fn save(&mut self, user: NewUser) -> Result<UserId, RepositoryError> {
            let id = UserId(self.next_id);
            self.next_id += 1;
            self.users.push(user);
            Ok(id)
        }
    }
}
