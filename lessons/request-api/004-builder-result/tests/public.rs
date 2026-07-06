use rust_daily_lesson::{BuildError, Request, RequestBuilder};

#[test]
fn builds_complete_request() {
    assert_eq!(
        RequestBuilder::new().method("GET").path("/health").build(),
        Ok(Request {
            method: "GET".to_owned(),
            path: "/health".to_owned(),
        })
    );
}

#[test]
fn reports_missing_fields() {
    assert_eq!(
        RequestBuilder::new().path("/health").build(),
        Err(BuildError::MissingMethod)
    );
    assert_eq!(
        RequestBuilder::new().method("GET").build(),
        Err(BuildError::MissingPath)
    );
}
