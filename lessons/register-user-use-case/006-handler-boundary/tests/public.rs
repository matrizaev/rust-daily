use rust_daily_lesson::adapters::{handle_register_user, RegisterUserRequest};
use rust_daily_lesson::application::{RepositoryError, UserRepository};
use rust_daily_lesson::domain::{EmailAddress, NewUser, UserId};

struct FakeRepo {
    exists: Result<bool, RepositoryError>,
}

impl UserRepository for FakeRepo {
    fn exists_by_email(&self, _email: &EmailAddress) -> Result<bool, RepositoryError> {
        self.exists
    }

    fn save(&mut self, _user: NewUser) -> Result<UserId, RepositoryError> {
        Ok(UserId(1))
    }
}

#[test]
fn handler_maps_usecase_outcomes() {
    let request = RegisterUserRequest {
        email: "ada@example.com".to_owned(),
        display_name: "Ada".to_owned(),
    };
    let mut ok = FakeRepo { exists: Ok(false) };
    let mut duplicate = FakeRepo { exists: Ok(true) };
    let mut unavailable = FakeRepo {
        exists: Err(RepositoryError::Unavailable),
    };

    assert_eq!(handle_register_user(&mut ok, request.clone()).status, 201);
    assert_eq!(
        handle_register_user(&mut duplicate, request.clone()).status,
        409
    );
    assert_eq!(handle_register_user(&mut unavailable, request).status, 503);
}

#[test]
fn handler_rejects_invalid_request_before_usecase() {
    let mut repo = FakeRepo { exists: Ok(false) };
    let response = handle_register_user(
        &mut repo,
        RegisterUserRequest {
            email: " ".to_owned(),
            display_name: "Ada".to_owned(),
        },
    );

    assert_eq!(response.status, 400);
}
