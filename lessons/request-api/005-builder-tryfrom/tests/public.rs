use rust_daily_lesson::{BuildError, RawRequest, Request};

#[test]
fn converts_complete_raw_request() {
    assert_eq!(
        Request::try_from(RawRequest {
            method: Some("GET".to_owned()),
            path: Some("/health".to_owned()),
        }),
        Ok(Request {
            method: "GET".to_owned(),
            path: "/health".to_owned(),
            body: None,
        })
    );
}

#[test]
fn reports_missing_request_fields() {
    assert_eq!(
        Request::try_from(RawRequest { method: None, path: Some("/health".to_owned()) }),
        Err(BuildError::MissingMethod)
    );
    assert_eq!(
        Request::try_from(RawRequest { method: Some("GET".to_owned()), path: None }),
        Err(BuildError::MissingPath)
    );
}
