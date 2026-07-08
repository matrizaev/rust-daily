use rust_daily_lesson::application::{RepositoryError, UserRepository};
use rust_daily_lesson::domain::{EmailAddress, NewUser, UserId};

struct FakeRepo;

impl UserRepository for FakeRepo {
    fn exists_by_email(&self, _email: &EmailAddress) -> Result<bool, RepositoryError> {
        Ok(false)
    }

    fn save(&mut self, _user: NewUser) -> Result<UserId, RepositoryError> {
        Ok(UserId(1))
    }
}

#[test]
fn repository_port_is_implementable_by_adapters() {
    let mut repo = FakeRepo;
    let email = EmailAddress::new("ada@example.com");
    let user = NewUser::new(email.clone(), "Ada");

    assert_eq!(repo.exists_by_email(&email), Ok(false));
    assert_eq!(repo.save(user), Ok(UserId(1)));
}
