use serde::Deserialize;
use thiserror::Error;

use crate::domain::{EmailAddress, RegisterUserCommand};

#[derive(Debug, Clone, Deserialize, PartialEq, Eq)]
pub struct RegisterUserRequest {
    pub email: String,
    pub display_name: String,
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RequestError {
    #[error("email is empty")]
    EmptyEmail,
    #[error("display name is empty")]
    EmptyDisplayName,
}

impl TryFrom<RegisterUserRequest> for RegisterUserCommand {
    type Error = RequestError;

    fn try_from(request: RegisterUserRequest) -> Result<Self, Self::Error> {
        let email = request.email.trim();
        let display_name = request.display_name.trim();

        if email.is_empty() {
            return Err(RequestError::EmptyEmail);
        }

        if display_name.is_empty() {
            return Err(RequestError::EmptyDisplayName);
        }

        Ok(RegisterUserCommand::new(
            EmailAddress::new(email),
            display_name,
        ))
    }
}
