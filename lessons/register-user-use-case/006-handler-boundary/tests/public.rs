use rust_daily_lesson::{
    adapters::{RegisterUserRequest, handle_register_user},
    application::{
        NewUser, RegisterUserError, RepositoryError, UserId, UserRepository,
        register_user_with_timeout,
    },
    domain::{EmailAddress, RegisterUserCommand},
    infrastructure::InMemoryUserRepository,
};
use std::time::Duration;

struct SlowRepository;

impl UserRepository for SlowRepository {
    async fn email_exists(&self, _email: &str) -> Result<bool, RepositoryError> {
        tokio::time::sleep(Duration::from_millis(50)).await;
        Ok(false)
    }

    async fn save(&self, _user: NewUser) -> Result<UserId, RepositoryError> {
        Ok(UserId::new(1))
    }
}

#[actix_rt::test]
async fn timeout_policy_maps_elapsed_work_to_timed_out() {
    let command = RegisterUserCommand::new(EmailAddress::new("ada@example.com"), "Ada");

    let result =
        register_user_with_timeout(&SlowRepository, command, Duration::from_millis(1)).await;

    assert_eq!(result, Err(RegisterUserError::TimedOut));
}

#[actix_rt::test]
async fn adapter_maps_success_and_duplicate_to_http_status_values() {
    let repository = InMemoryUserRepository::new();
    let request = || RegisterUserRequest {
        email: "ada@example.com".to_owned(),
        display_name: "Ada".to_owned(),
    };

    let created = handle_register_user(&repository, request()).await;
    let duplicate = handle_register_user(&repository, request()).await;

    assert_eq!(created.status, 201);
    assert_eq!(duplicate.status, 409);
}
