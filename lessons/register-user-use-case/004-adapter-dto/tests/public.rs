use rust_daily_lesson::adapters::{RegisterUserRequest, RequestError};
use rust_daily_lesson::domain::RegisterUserCommand;

#[test]
fn adapter_request_converts_to_domain_command() {
    let command = RegisterUserCommand::try_from(RegisterUserRequest { email: " ada@example.com ".to_owned(), display_name: " Ada ".to_owned() });
    assert_eq!(command.map(|command| command.display_name), Ok("Ada".to_owned()));
}

#[test]
fn adapter_request_rejects_empty_email() {
    assert_eq!(
        RegisterUserCommand::try_from(RegisterUserRequest { email: " ".to_owned(), display_name: "Ada".to_owned() }),
        Err(RequestError::EmptyEmail)
    );
}
