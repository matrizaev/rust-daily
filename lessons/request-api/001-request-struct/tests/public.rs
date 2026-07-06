use rust_daily_lesson::Request;

#[test]
fn request_surface_owns_completed_request_data() {
    let request = Request {
        method: "POST".to_owned(),
        path: "/users".to_owned(),
        body: Some("{}".to_owned()),
    };

    assert_eq!(request.method, "POST");
    assert_eq!(request.path, "/users");
    assert_eq!(request.body, Some("{}".to_owned()));
}
