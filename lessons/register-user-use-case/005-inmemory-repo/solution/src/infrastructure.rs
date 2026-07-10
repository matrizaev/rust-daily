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
