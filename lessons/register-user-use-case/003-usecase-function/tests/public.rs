use rust_daily_lesson::application::{
    register_user, RegisterUserError, RepositoryError, UserRepository,
};
use rust_daily_lesson::domain::{EmailAddress, NewUser, RegisterUserCommand, UserId};

struct FakeRepo {
    exists: bool,
}

impl UserRepository for FakeRepo {
    fn exists_by_email(&self, _email: &EmailAddress) -> Result<bool, RepositoryError> {
        Ok(self.exists)
    }

    fn save(&mut self, _user: NewUser) -> Result<UserId, RepositoryError> {
        Ok(UserId(7))
    }
}

#[test]
fn usecase_saves_new_user() {
    let mut repo = FakeRepo { exists: false };
    let command = RegisterUserCommand::new(EmailAddress::new("ada@example.com"), "Ada");

    assert_eq!(register_user(&mut repo, command), Ok(UserId(7)));
}

#[test]
fn usecase_rejects_duplicate_email() {
    let mut repo = FakeRepo { exists: true };
    let command = RegisterUserCommand::new(EmailAddress::new("ada@example.com"), "Ada");

    assert_eq!(
        register_user(&mut repo, command),
        Err(RegisterUserError::DuplicateEmail)
    );
}
