use rust_daily_lesson::Config;

#[test]
fn config_groups_owned_service_settings() {
    let config = Config {
        service_url: "http://localhost:8080".to_owned(),
        max_connections: 32,
        use_tls: false,
    };

    assert_eq!(config.service_url, "http://localhost:8080");
    assert_eq!(config.max_connections, 32);
    assert!(!config.use_tls);
}
