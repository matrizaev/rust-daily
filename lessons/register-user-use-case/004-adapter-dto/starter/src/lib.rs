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

// Continue from the previous lesson.
// TODO: implement TryFrom<RegisterUserRequest> for RegisterUserCommand.
