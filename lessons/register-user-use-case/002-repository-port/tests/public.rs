use rust_daily_lesson::application::{NewUser, UserId};
use rust_daily_lesson::domain::{EmailAddress, RegisterUserCommand};

#[test]
fn new_user_is_built_from_domain_command() {
    let command = RegisterUserCommand::new(EmailAddress::new("ada@example.com"), "Ada");
    let user = NewUser::from_command(command);

    assert_eq!(user.email(), "ada@example.com");
    assert_eq!(user.display_name(), "Ada");
    assert_eq!(UserId::new(7).value(), 7);
}
