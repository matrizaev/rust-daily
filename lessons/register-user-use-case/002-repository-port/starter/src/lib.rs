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

    // TODO: define UserRepository port trait.
}
