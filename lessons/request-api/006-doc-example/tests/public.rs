use rust_daily_lesson::{Request, RequestBuilder};

#[test]
fn documented_builder_flow_works() {
    assert_eq!(
        RequestBuilder::default()
            .method("GET")
            .path("/items")
            .build(),
        Ok(Request {
            method: "GET".to_owned(),
            path: "/items".to_owned(),
            body: None,
        })
    );
}
