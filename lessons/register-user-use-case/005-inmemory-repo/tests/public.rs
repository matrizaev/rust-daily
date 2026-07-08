use rust_daily_lesson::application::UserRepository;
use rust_daily_lesson::domain::{EmailAddress, NewUser, UserId};
use rust_daily_lesson::infrastructure::InMemoryUserRepository;

#[test]
fn infrastructure_repo_implements_port() {
    let mut repo = InMemoryUserRepository::new();
    let email = EmailAddress::new("ada@example.com");

    assert_eq!(repo.exists_by_email(&email), Ok(false));
    assert_eq!(repo.save(NewUser::new(email.clone(), "Ada")), Ok(UserId(1)));
    assert_eq!(repo.exists_by_email(&email), Ok(true));
}
