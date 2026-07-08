use rust_daily_lesson::{Request, RequestBuilder};

#[test]
fn documented_builder_flow_works() {
    assert_eq!(
        RequestBuilder::default()
            .method("GET")
            .path("/health")
            .build(),
        Ok(Request {
            method: "GET".to_owned(),
            path: "/health".to_owned(),
            body: None,
        })
    );
}
