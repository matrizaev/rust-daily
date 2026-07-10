use rust_daily_lesson::RegisterUserCommand;

fn main() {
    let command = RegisterUserCommand::new("ada@example.com", "Ada");
    let _ = serde_json::to_string(&command).unwrap();
}
