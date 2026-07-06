pub mod domain {
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct EmailAddress(pub String);
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct UserId(pub u64);
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct NewUser { pub email: EmailAddress, pub display_name: String }
}

pub mod application {
    use super::domain::{EmailAddress, NewUser, UserId};

    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum RepositoryError { Unavailable }

    pub trait UserRepository {
        fn exists_by_email(&self, email: &EmailAddress) -> Result<bool, RepositoryError>;
        fn save(&mut self, user: NewUser) -> Result<UserId, RepositoryError>;
    }
}
