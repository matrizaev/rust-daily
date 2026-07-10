use rust_daily_lesson::RegisterUserCommand;

fn main() {
    let _ = RegisterUserCommand {
        email: String::from("ada@example.com"),
        display_name: String::from("Ada"),
    };
}
