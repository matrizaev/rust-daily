use rust_daily_lesson::domain::{EmailAddress, RegisterUserCommand};

#[test]
fn domain_command_has_no_adapter_dependency() {
    let command = RegisterUserCommand::new(EmailAddress::new("ada@example.com"), "Ada");

    assert_eq!(command.email().as_str(), "ada@example.com");
    assert_eq!(command.display_name(), "Ada");
}
