use rust_daily_lesson::{Host, HostValidationError};

#[test]
fn host_try_from() {
    assert_eq!(Host::try_from("localhost".to_owned()).map(|h| h.as_str().to_owned()), Ok("localhost".to_owned()));
    assert_eq!(Host::try_from("".to_owned()), Err(HostValidationError::Empty));
    assert_eq!(Host::try_from("bad host".to_owned()), Err(HostValidationError::InvalidCharacters));
}
