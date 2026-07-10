use std::time::Duration;

use thiserror::Error;

use crate::domain::RegisterUserCommand;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub struct UserId(u64);

impl UserId {
    pub fn new(value: u64) -> Self {
        Self(value)
    }

    pub fn value(self) -> u64 {
        self.0
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NewUser {
    email: String,
    display_name: String,
}

impl NewUser {
    pub fn from_command(command: RegisterUserCommand) -> Self {
        Self {
            email: command.email().as_str().to_owned(),
            display_name: command.display_name().to_owned(),
        }
    }

    pub fn email(&self) -> &str {
        &self.email
    }

    pub fn display_name(&self) -> &str {
        &self.display_name
    }
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RepositoryError {
    #[error("repository is unavailable")]
    Unavailable,
    #[error("email already exists")]
    Conflict,
}

pub trait UserRepository: Send + Sync {
    fn email_exists(
        &self,
        email: &str,
    ) -> impl std::future::Future<Output = Result<bool, RepositoryError>> + Send;

    fn save(
        &self,
        user: NewUser,
    ) -> impl std::future::Future<Output = Result<UserId, RepositoryError>> + Send;
}

#[derive(Debug, Clone, Copy, Error, PartialEq, Eq)]
pub enum RegisterUserError {
    #[error("email already exists")]
    DuplicateEmail,
    #[error("registration timed out")]
    TimedOut,
    #[error(transparent)]
    Repository(#[from] RepositoryError),
}

pub async fn register_user<R: UserRepository>(
    repository: &R,
    command: RegisterUserCommand,
) -> Result<UserId, RegisterUserError> {
    if repository.email_exists(command.email().as_str()).await? {
        return Err(RegisterUserError::DuplicateEmail);
    }

    match repository.save(NewUser::from_command(command)).await {
        Ok(user_id) => Ok(user_id),
        Err(RepositoryError::Conflict) => Err(RegisterUserError::DuplicateEmail),
        Err(error) => Err(error.into()),
    }
}

pub async fn register_user_with_timeout<R: UserRepository>(
    repository: &R,
    command: RegisterUserCommand,
    duration: Duration,
) -> Result<UserId, RegisterUserError> {
    tokio::time::timeout(duration, register_user(repository, command))
        .await
        .map_err(|_| RegisterUserError::TimedOut)?
}
