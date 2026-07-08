use rust_daily_lesson::{
    application::{register_user, NewUser, RepositoryError, UserId, UserRepository},
    domain::{EmailAddress, RegisterUserCommand},
};

struct AvailableRepository;

impl UserRepository for AvailableRepository {
    async fn email_exists(&self, _email: &str) -> Result<bool, RepositoryError> {
        Ok(false)
    }

    async fn save(&self, _user: NewUser) -> Result<UserId, RepositoryError> {
        Ok(UserId::new(42))
    }
}

#[actix_rt::test]
async fn registers_user_through_async_port() {
    let command = RegisterUserCommand::new(EmailAddress::new("ada@example.com"), "Ada");

    assert_eq!(register_user(&AvailableRepository, command).await, Ok(UserId::new(42)));
}
