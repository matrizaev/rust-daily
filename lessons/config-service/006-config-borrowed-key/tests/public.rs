use rust_daily_lesson::get_setting;

#[test]
fn lookup_borrows_key_and_value() {
    let settings = vec![
        ("host".to_owned(), "localhost".to_owned()),
        ("port".to_owned(), "8080".to_owned()),
    ];

    assert_eq!(get_setting(&settings, "host"), Some("localhost"));
    assert_eq!(get_setting(&settings, "missing"), None);
}
