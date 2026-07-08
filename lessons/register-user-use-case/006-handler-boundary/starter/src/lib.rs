pub mod domain {
    #[derive(Debug, Clone, PartialEq, Eq, Hash)]
    pub struct EmailAddress(String);

    impl EmailAddress {
        pub fn new(value: impl Into<String>) -> Self {
            Self(value.into())
        }

        pub fn as_str(&self) -> &str {
            &self.0
        }
    }

    #[derive(Debug, Clone, PartialEq, Eq)]
    pub struct RegisterUserCommand {
        email: EmailAddress,
        display_name: String,
    }

    impl RegisterUserCommand {
        pub fn new(email: EmailAddress, display_name: impl Into<String>) -> Self {
            Self {
                email,
                display_name: display_name.into(),
            }
        }

        pub fn email(&self) -> &EmailAddress {
            &self.email
        }

        pub fn display_name(&self) -> &str {
            &self.display_name
        }
    }
}

pub mod application {
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
}

pub mod adapters {
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
}

pub mod infrastructure {
    use std::{collections::HashMap, sync::Arc};

    use tokio::sync::RwLock;

    use crate::application::{NewUser, RepositoryError, UserId, UserRepository};

    #[derive(Debug, Clone)]
    pub struct InMemoryUserRepository {
        state: Arc<RwLock<State>>,
    }

    #[derive(Debug)]
    struct State {
        next_id: u64,
        users_by_email: HashMap<String, UserId>,
    }

    impl InMemoryUserRepository {
        pub fn new() -> Self {
            Self {
                state: Arc::new(RwLock::new(State {
                    next_id: 1,
                    users_by_email: HashMap::new(),
                })),
            }
        }

        pub async fn len(&self) -> usize {
            self.state.read().await.users_by_email.len()
        }
    }

    impl Default for InMemoryUserRepository {
        fn default() -> Self {
            Self::new()
        }
    }

    impl UserRepository for InMemoryUserRepository {
        async fn email_exists(&self, email: &str) -> Result<bool, RepositoryError> {
            Ok(self.state.read().await.users_by_email.contains_key(email))
        }

        async fn save(&self, user: NewUser) -> Result<UserId, RepositoryError> {
            let mut state = self.state.write().await;

            if state.users_by_email.contains_key(user.email()) {
                return Err(RepositoryError::Conflict);
            }

            let user_id = UserId::new(state.next_id);
            state.next_id += 1;
            state
                .users_by_email
                .insert(user.email().to_owned(), user_id);

            Ok(user_id)
        }
    }
}

// TODO: add timeout mapping and the thin Actix handler.
