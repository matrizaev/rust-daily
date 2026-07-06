use rust_daily_lesson::{handle_register_user, RegisterUserCommand, RegisterUserError, RegisterUserRequest, RegisterUserUseCase, UserId};

struct FakeUseCase { result: Result<UserId, RegisterUserError> }
impl RegisterUserUseCase for FakeUseCase {
    fn register_user(&mut self, _command: RegisterUserCommand) -> Result<UserId, RegisterUserError> { self.result }
}

#[test]
fn handler_maps_usecase_outcomes() {
    let request = RegisterUserRequest { email: "ada@example.com".to_owned(), display_name: "Ada".to_owned() };
    let mut ok = FakeUseCase { result: Ok(UserId(1)) };
    let mut duplicate = FakeUseCase { result: Err(RegisterUserError::DuplicateEmail) };

    assert_eq!(handle_register_user(&mut ok, request.clone()).status, 201);
    assert_eq!(handle_register_user(&mut duplicate, request).status, 409);
}

#[test]
fn handler_rejects_invalid_request_before_usecase() {
    let mut use_case = FakeUseCase { result: Ok(UserId(1)) };
    let response = handle_register_user(&mut use_case, RegisterUserRequest { email: " ".to_owned(), display_name: "Ada".to_owned() });

    assert_eq!(response.status, 400);
}
