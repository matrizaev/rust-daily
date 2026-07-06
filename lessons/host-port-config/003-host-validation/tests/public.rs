use rust_daily_lesson::{Host, HostValidationError};

#[test]
fn host_try_from_string_reuses_validation() {
    assert_eq!(
        Host::try_from("localhost".to_owned()).map(|host| host.as_str().to_owned()),
        Ok("localhost".to_owned())
    );
    assert_eq!(Host::try_from(String::new()), Err(HostValidationError::Empty));
    assert_eq!(
        Host::try_from("bad host".to_owned()),
        Err(HostValidationError::InvalidCharacters)
    );
}
