pub mod domain {
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct EmailAddress(pub String);
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct UserId(pub u64);
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct RegisterUserCommand { pub email: EmailAddress, pub display_name: String }
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

    // TODO: implement register_user.
}
