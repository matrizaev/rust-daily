use rust_daily_lesson::RegisterUserCommand;

#[test]
fn command_exposes_borrowed_views() {
    let command = RegisterUserCommand::new("ada@example.com", "Ada");

    assert_eq!(command.email(), "ada@example.com");
    assert_eq!(command.display_name(), "Ada");
}
