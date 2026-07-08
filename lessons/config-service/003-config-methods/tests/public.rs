use rust_daily_lesson::Config;

#[test]
fn with_service_url_updates_only_the_url() {
    let config = Config::default().with_service_url("https://api.example.com");

    assert_eq!(config.service_url, "https://api.example.com");
    assert_eq!(config.max_connections, 32);
    assert!(!config.use_tls);
}
