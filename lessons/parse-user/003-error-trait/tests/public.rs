use rust_daily_lesson::ParseUserError;

fn assert_error<E: std::error::Error>() {}

#[test]
fn parse_user_error_is_standard_error() {
    assert_error::<ParseUserError>();
}
