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
