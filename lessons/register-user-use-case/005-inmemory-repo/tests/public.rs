use rust_daily_lesson::application::UserRepository;
use rust_daily_lesson::domain::{EmailAddress, NewUser, UserId};
use rust_daily_lesson::infrastructure::InMemoryUserRepository;

#[test]
fn infrastructure_repo_implements_port() {
    let mut repo = InMemoryUserRepository::new();
    let email = EmailAddress("ada@example.com".to_owned());

    assert_eq!(repo.exists_by_email(&email), Ok(false));
    assert_eq!(repo.save(NewUser { email: email.clone(), display_name: "Ada".to_owned() }), Ok(UserId(1)));
    assert_eq!(repo.exists_by_email(&email), Ok(true));
}
