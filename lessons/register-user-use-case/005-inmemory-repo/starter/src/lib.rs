pub mod domain {
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct EmailAddress(pub String);
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct RegisterUserCommand { pub email: EmailAddress, pub display_name: String }
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct UserId(pub u64);
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct NewUser { pub email: EmailAddress, pub display_name: String }
}

pub mod application {
    use super::domain::{EmailAddress, NewUser, RegisterUserCommand, UserId};

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum RepositoryError { Unavailable }
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum RegisterUserError { DuplicateEmail, Repository(RepositoryError) }

    pub trait UserRepository {
        fn exists_by_email(&self, email: &EmailAddress) -> Result<bool, RepositoryError>;
        fn save(&mut self, user: NewUser) -> Result<UserId, RepositoryError>;
    }

    pub fn register_user<R: UserRepository>(repo: &mut R, command: RegisterUserCommand) -> Result<UserId, RegisterUserError> {
        if repo.exists_by_email(&command.email).map_err(RegisterUserError::Repository)? {
            return Err(RegisterUserError::DuplicateEmail);
        }

        repo.save(NewUser { email: command.email, display_name: command.display_name })
            .map_err(RegisterUserError::Repository)
    }
}

pub mod adapters {
    use super::domain::{EmailAddress, RegisterUserCommand};

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct RegisterUserRequest { pub email: String, pub display_name: String }
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum RequestError { EmptyEmail, EmptyDisplayName }

    impl TryFrom<RegisterUserRequest> for RegisterUserCommand {
        type Error = RequestError;

        fn try_from(value: RegisterUserRequest) -> Result<Self, Self::Error> {
            let email = value.email.trim();
            let display_name = value.display_name.trim();
            if email.is_empty() { return Err(RequestError::EmptyEmail); }
            if display_name.is_empty() { return Err(RequestError::EmptyDisplayName); }

            Ok(Self { email: EmailAddress(email.to_owned()), display_name: display_name.to_owned() })
        }
    }
}

// Continue from the previous lesson.
// TODO: implement UserRepository.
