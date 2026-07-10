use std::time::Duration;

use actix_web::{HttpResponse, Responder, http::StatusCode, web};
use serde::Deserialize;
use thiserror::Error;

use crate::{
    application::{RegisterUserError, UserRepository, register_user_with_timeout},
    domain::{EmailAddress, RegisterUserCommand},
};

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

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Response {
    pub status: u16,
    pub body: String,
}

pub async fn handle_register_user<R: UserRepository>(
    repository: &R,
    request: RegisterUserRequest,
) -> Response {
    let command = match RegisterUserCommand::try_from(request) {
        Ok(command) => command,
        Err(error) => {
            return Response {
                status: 400,
                body: error.to_string(),
            };
        }
    };

    match register_user_with_timeout(repository, command, Duration::from_secs(1)).await {
        Ok(user_id) => Response {
            status: 201,
            body: user_id.value().to_string(),
        },
        Err(RegisterUserError::DuplicateEmail) => Response {
            status: 409,
            body: "email already exists".to_owned(),
        },
        Err(RegisterUserError::TimedOut) => Response {
            status: 504,
            body: "registration timed out".to_owned(),
        },
        Err(RegisterUserError::Repository(_)) => Response {
            status: 503,
            body: "repository is unavailable".to_owned(),
        },
    }
}

pub async fn register_user_handler<R>(
    repository: web::Data<R>,
    request: web::Json<RegisterUserRequest>,
) -> impl Responder
where
    R: UserRepository + 'static,
{
    let response = handle_register_user(repository.get_ref(), request.into_inner()).await;
    let status = StatusCode::from_u16(response.status).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR);

    HttpResponse::build(status).body(response.body)
}
