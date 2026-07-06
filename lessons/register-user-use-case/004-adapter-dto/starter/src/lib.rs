pub mod domain {
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct EmailAddress(pub String);
    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct RegisterUserCommand { pub email: EmailAddress, pub display_name: String }
}

pub mod adapters {
    use super::domain::{EmailAddress, RegisterUserCommand};

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct RegisterUserRequest { pub email: String, pub display_name: String }
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub enum RequestError { EmptyEmail, EmptyDisplayName }

    // TODO: implement TryFrom<RegisterUserRequest> for RegisterUserCommand.
}
