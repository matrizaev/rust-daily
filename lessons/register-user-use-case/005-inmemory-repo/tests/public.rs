use rust_daily_lesson::{
    application::{register_user, RegisterUserError},
    domain::{EmailAddress, RegisterUserCommand},
    infrastructure::InMemoryUserRepository,
};

#[actix_rt::test]
async fn repository_rejects_duplicate_registration() {
    let repository = InMemoryUserRepository::new();
    let command = || RegisterUserCommand::new(EmailAddress::new("ada@example.com"), "Ada");

    assert!(register_user(&repository, command()).await.is_ok());
    assert_eq!(
        register_user(&repository, command()).await,
        Err(RegisterUserError::DuplicateEmail)
    );
    assert_eq!(repository.len().await, 1);
}
