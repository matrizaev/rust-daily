use rust_daily_lesson::{Host, HostValidationError};

#[test]
fn host_representation_is_validated() {
    assert_eq!(
        Host::try_from("localhost").map(|host| host.as_str().to_owned()),
        Ok("localhost".to_owned())
    );
    assert_eq!(Host::try_from(""), Err(HostValidationError::Empty));
    assert_eq!(
        Host::try_from("bad host"),
        Err(HostValidationError::InvalidCharacters)
    );
}
