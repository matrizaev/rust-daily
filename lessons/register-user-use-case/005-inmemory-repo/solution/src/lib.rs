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

pub mod infrastructure {
    use super::application::{RepositoryError, UserRepository};
    use super::domain::{EmailAddress, NewUser, UserId};

    pub struct InMemoryUserRepository { users: Vec<NewUser>, next_id: u64 }

    impl InMemoryUserRepository { pub fn new() -> Self { Self { users: Vec::new(), next_id: 1 } } }

    impl UserRepository for InMemoryUserRepository {
        fn exists_by_email(&self, email: &EmailAddress) -> Result<bool, RepositoryError> {
            Ok(self.users.iter().any(|user| user.email == *email))
        }

        fn save(&mut self, user: NewUser) -> Result<UserId, RepositoryError> {
            let id = UserId(self.next_id);
            self.next_id += 1;
            self.users.push(user);
            Ok(id)
        }
    }
}
